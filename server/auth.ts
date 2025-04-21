import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import MemoryStore from "memorystore";

// Extend Express.Request type to include custom properties
declare global {
  namespace Express {
    interface Request {
      isAdmin(): boolean;
    }
    
    // Augment the User interface
    interface User {
      id: number;
      username: string;
      password: string;
      email?: string;
      name?: string;
      isAdmin: boolean;
      createdAt?: Date;
    }
  }
}

const MemoryStoreSession = MemoryStore(session);
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'wedding-timeline-secret',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth endpoints
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        isAdmin: false // Default to non-admin for new registrations
      });

      // Get the default template
      const templates = await storage.getTimelineTemplates();
      const defaultTemplate = templates.find(t => t.isDefault) || templates[0];
      
      if (defaultTemplate) {
        // Create a new timeline based on the default template
        const newTimeline = await storage.createWeddingTimeline({
          userId: user.id,
          name: "My Wedding",
          weddingDate: new Date().toISOString().split('T')[0], // Today's date
          startHour: 6,
          timeFormat: "24h",
        });

        // Get template events
        const templateEvents = await storage.getTemplateEvents(defaultTemplate.id);
        
        // Create timeline events from template events
        for (const templateEvent of templateEvents) {
          await storage.createTimelineEvent({
            userId: user.id,
            timelineId: newTimeline.id,
            name: templateEvent.name,
            startTime: templateEvent.startTime,
            endTime: templateEvent.endTime,
            category: templateEvent.category,
            color: templateEvent.color,
            notes: templateEvent.notes,
            position: templateEvent.position,
          });
        }

        // Set this as the user's last selected timeline
        await storage.updateUserLastSelectedTimeline(user.id, newTimeline.id);
      }

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    // Check if required fields are present
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: "Please provide both username and password" });
    }
    
    passport.authenticate("local", (err: Error, user: User, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Please check your username and password and try again." });
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "You need to sign in to access your account." });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = req.user as User;
    res.status(200).json(userWithoutPassword);
  });
  
  // Password change endpoint
  app.post("/api/user/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "New passwords do not match" });
      }
      
      // Minimum password length check
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }
      
      // Verify old password
      const user = await storage.getUser((req.user as User).id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user with new password
      await storage.updateUser(user.id, { password: hashedPassword });
      
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin-only endpoints
  app.get("/api/admin/users", (req, res) => {
    const user = req.user as User;
    
    if (!req.isAuthenticated() || !user.isAdmin) {
      return res.status(403).json({ message: "You don't have permission to access this feature." });
    }

    // Implement admin functionality here
    storage.getAllUsers().then(users => {
      // Map users to remove passwords
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.status(200).json(sanitizedUsers);
    }).catch(err => {
      res.status(500).json({ message: "Error retrieving users" });
    });
  });

  // Authorization middleware for routes that require admin access
  // Usage: app.get("/admin-route", isAdmin, (req, res) => { ... });
  app.use((req, res, next) => {
    req.isAdmin = () => {
      const user = req.user as User;
      return req.isAuthenticated() && user.isAdmin;
    };
    next();
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "You need to sign in to access this feature." });
}

// Middleware to check if user is an admin
export function isAdmin(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  const user = req.user as User;
  if (req.isAuthenticated() && user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "You don't have permission to access this feature." });
}