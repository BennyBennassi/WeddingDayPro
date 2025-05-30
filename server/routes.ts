import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTimelineEventSchema, 
  insertWeddingTimelineSchema, 
  insertVenueRestrictionSchema,
  insertTimelineQuestionSchema,
  insertUserQuestionResponseSchema,
  insertTimelineTemplateSchema,
  insertTemplateEventSchema,
  insertEmailTemplateSchema,
  insertAppSettingSchema,
  timelineEvents,
  venueRestrictions,
  weddingTimelines,
  userQuestionResponses,
  emailTemplates,
  appSettings
} from "@shared/schema";
import { sendPasswordResetEmail } from "./email";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import crypto from 'crypto';

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Define API routes
  const apiRouter = app.route("/api");
  
  // Timeline events
  app.get("/api/timeline-events/:timelineId", async (req, res) => {
    try {
      const timelineId = parseInt(req.params.timelineId);
      if (isNaN(timelineId)) {
        return res.status(400).json({ message: "Invalid timeline ID" });
      }
      
      const events = await storage.getTimelineEvents(timelineId);
      res.json(events);
    } catch (error) {
      console.error("Error getting timeline events:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/timeline-events", async (req, res) => {
    try {
      // Make sure timelineId is properly set if provided in query param but not in body
      let eventData = req.body;
      
      // If timelineId is in the query string but not in the body, add it
      if (req.query.timelineId && !eventData.timelineId) {
        const timelineId = parseInt(req.query.timelineId as string);
        if (!isNaN(timelineId)) {
          eventData = { ...eventData, timelineId };
        }
      }
      
      const parsedEventData = insertTimelineEventSchema.parse(eventData);
      const newEvent = await storage.createTimelineEvent(parsedEventData);
      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating timeline event:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/timeline-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const existingEvent = await storage.getTimelineEvent(id);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      const updatedEvent = await storage.updateTimelineEvent(id, req.body);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating timeline event:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/timeline-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const success = await storage.deleteTimelineEvent(id);
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting timeline event:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete all events from a timeline
  app.delete("/api/timeline-events/timeline/:timelineId", async (req, res) => {
    try {
      const timelineId = parseInt(req.params.timelineId);
      if (isNaN(timelineId)) {
        return res.status(400).json({ message: "Invalid timeline ID" });
      }
      
      // Get the timeline to retrieve the userId
      const timeline = await storage.getWeddingTimeline(timelineId);
      if (!timeline) {
        return res.status(404).json({ message: "Timeline not found" });
      }
      
      // First, directly get events for this specific timelineId
      const events = await db.select()
        .from(timelineEvents)
        .where(eq(timelineEvents.timelineId, timelineId));
      
      console.log(`Found ${events.length} events directly linked to timeline ${timelineId}`);
      
      if (events.length === 0) {
        // If no events are directly linked to this timeline, fall back to getting events by userId
        // This is a backwards compatibility approach
        // Use SQL expression to handle potential null values properly
        const userEvents = await db.select()
          .from(timelineEvents)
          .where(timeline.userId ? eq(timelineEvents.userId, timeline.userId) : undefined);
        
        console.log(`Found ${userEvents.length} events for user ${timeline.userId}`);
        
        if (userEvents.length === 0) {
          return res.status(200).json({ message: "No events to delete" });
        }
        
        // Delete each event from this user
        let deletedCount = 0;
        for (const event of userEvents) {
          const success = await storage.deleteTimelineEvent(event.id);
          if (success) deletedCount++;
        }
        
        // Return a success response
        return res.status(200).json({ 
          message: `Successfully deleted ${deletedCount} user events`,
          deletedCount,
          timelineId
        });
      } else {
        // Delete each event from this timeline
        let deletedCount = 0;
        for (const event of events) {
          const success = await storage.deleteTimelineEvent(event.id);
          if (success) deletedCount++;
        }
        
        // Return a success response
        return res.status(200).json({ 
          message: `Successfully deleted ${deletedCount} timeline events`,
          deletedCount,
          timelineId
        });
      }
    } catch (error) {
      console.error("Error clearing timeline events:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Wedding timelines
  app.get("/api/wedding-timelines", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const timelines = await storage.getWeddingTimelines(req.user.id);
      res.json(timelines);
    } catch (error) {
      console.error("Error getting wedding timelines:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/wedding-timelines/single/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid timeline ID" });
      }
      
      const timeline = await storage.getWeddingTimeline(id);
      if (!timeline) {
        return res.status(404).json({ message: "Timeline not found" });
      }
      
      res.json(timeline);
    } catch (error) {
      console.error("Error getting wedding timeline:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/wedding-timelines/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const timelines = await storage.getWeddingTimelines(userId);
      res.json(timelines);
    } catch (error) {
      console.error("Error getting wedding timelines:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/wedding-timelines", async (req, res) => {
    try {
      const timelineData = insertWeddingTimelineSchema.parse(req.body);
      const newTimeline = await storage.createWeddingTimeline(timelineData);
      res.status(201).json(newTimeline);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating wedding timeline:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/wedding-timelines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid timeline ID" });
      }
      
      const existingTimeline = await storage.getWeddingTimeline(id);
      if (!existingTimeline) {
        return res.status(404).json({ message: "Timeline not found" });
      }
      
      const updatedTimeline = await storage.updateWeddingTimeline(id, req.body);
      res.json(updatedTimeline);
    } catch (error) {
      console.error("Error updating wedding timeline:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/wedding-timelines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid timeline ID" });
      }
      
      // Check if timeline exists
      const timeline = await storage.getWeddingTimeline(id);
      if (!timeline) {
        return res.status(404).json({ message: "Timeline not found" });
      }
      
      console.log(`Preparing to delete timeline ${id} (${timeline.name})`);
      
      // Step 1: Delete associated venue restrictions directly from the database
      try {
        // Use Drizzle ORM instead of raw SQL
        await db.delete(venueRestrictions).where(eq(venueRestrictions.timelineId, id));
        console.log(`Deleted venue restrictions for timeline ${id}`);
      } catch (err) {
        console.error(`Error deleting venue restrictions for timeline ${id}:`, err);
        // Continue anyway
      }
      
      // Step 2: Delete all timeline events that reference this timeline
      try {
        // First get events directly linked to this timeline
        const events = await db.select().from(timelineEvents).where(eq(timelineEvents.timelineId, id));
        console.log(`Found ${events.length} events directly linked to timeline ${id}`);
        
        // Delete each event
        for (const event of events) {
          await storage.deleteTimelineEvent(event.id);
        }
        
        // Also look for events that might belong to this user without proper timeline_id
        if (timeline.userId) {
          // Delete all events from this user that don't have a timeline_id or match this timeline
          await db.delete(timelineEvents)
            .where(
              and(
                eq(timelineEvents.userId, timeline.userId),
                eq(timelineEvents.timelineId, id)
              )
            );
            
          // Also clean up events with null timeline ID from this user
          // Use isNull for checking null values instead of eq with null
          const eventsWithNullTimeline = await db.select()
            .from(timelineEvents)
            .where(
              and(
                eq(timelineEvents.userId, timeline.userId),
                // Check for timeline_id IS NULL
                sql`${timelineEvents.timelineId} IS NULL`
              )
            );
            
          for (const event of eventsWithNullTimeline) {
            await storage.deleteTimelineEvent(event.id);
          }
        }
      } catch (err) {
        console.error(`Error deleting events for timeline ${id}:`, err);
        // Continue anyway
      }
      
      // Step 3: Finally delete the timeline itself
      try {
        const success = await storage.deleteWeddingTimeline(id);
        if (success) {
          console.log(`Successfully deleted timeline ${id}`);
          res.status(204).send();
        } else {
          console.error(`Timeline ${id} could not be deleted from storage`);
          res.status(500).json({ message: "Error deleting timeline, please try again" });
        }
      } catch (err) {
        console.error(`Error deleting timeline ${id}:`, err);
        res.status(500).json({ message: "Error deleting timeline, please try again" });
      }
    } catch (error) {
      console.error("Error in delete timeline workflow:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Venue restrictions
  app.get("/api/venue-restrictions/:timelineId", async (req, res) => {
    try {
      const timelineId = parseInt(req.params.timelineId);
      if (isNaN(timelineId)) {
        return res.status(400).json({ message: "Invalid timeline ID" });
      }
      
      const restriction = await storage.getVenueRestriction(timelineId);
      if (!restriction) {
        return res.status(404).json({ message: "Venue restriction not found" });
      }
      
      res.json(restriction);
    } catch (error) {
      console.error("Error getting venue restriction:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/venue-restrictions", async (req, res) => {
    try {
      const restrictionData = insertVenueRestrictionSchema.parse(req.body);
      const newRestriction = await storage.createVenueRestriction(restrictionData);
      res.status(201).json(newRestriction);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating venue restriction:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/venue-restrictions/:timelineId", async (req, res) => {
    try {
      const timelineId = parseInt(req.params.timelineId);
      if (isNaN(timelineId)) {
        return res.status(400).json({ message: "Invalid timeline ID" });
      }
      
      const updatedRestriction = await storage.updateVenueRestriction(timelineId, req.body);
      if (!updatedRestriction) {
        return res.status(404).json({ message: "Venue restriction not found" });
      }
      
      res.json(updatedRestriction);
    } catch (error) {
      console.error("Error updating venue restriction:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords before sending to client
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow password updates through this endpoint
      const { password, ...updateData } = req.body;
      
      const updatedUser = await storage.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending response
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Add delete user endpoint (admin only)
  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow admins to delete themselves
      const adminUser = req.user;
      if (id === adminUser?.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      // Delete the user and all related data
      await storage.deleteUser(id);
      
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Timeline Questions - Admin Only Routes
  app.get("/api/admin/timeline-questions", isAdmin, async (req, res) => {
    try {
      const questions = await storage.getTimelineQuestions();
      res.json(questions);
    } catch (error) {
      console.error("Error getting timeline questions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/timeline-questions/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }
      
      const question = await storage.getTimelineQuestion(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json(question);
    } catch (error) {
      console.error("Error getting timeline question:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/timeline-questions", isAdmin, async (req, res) => {
    try {
      const questionData = insertTimelineQuestionSchema.parse(req.body);
      const newQuestion = await storage.createTimelineQuestion(questionData);
      res.status(201).json(newQuestion);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating timeline question:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/timeline-questions/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }
      
      const question = await storage.getTimelineQuestion(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      const updatedQuestion = await storage.updateTimelineQuestion(id, req.body);
      res.json(updatedQuestion);
    } catch (error) {
      console.error("Error updating timeline question:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  


  app.delete("/api/admin/timeline-questions/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }
      
      const success = await storage.deleteTimelineQuestion(id);
      if (!success) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting timeline question:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Timeline Questions - User Routes
  app.get("/api/timeline-questions", async (req, res) => {
    try {
      // Only return active questions for regular users
      const questions = await storage.getTimelineQuestions(true);
      res.json(questions);
    } catch (error) {
      console.error("Error getting timeline questions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User Question Responses
  app.get("/api/user-question-responses/:userId/:timelineId", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const timelineId = parseInt(req.params.timelineId);
      
      if (isNaN(userId) || isNaN(timelineId)) {
        return res.status(400).json({ message: "Invalid IDs provided" });
      }
      
      // Make sure users can only access their own responses (admins can access all)
      if (req.user?.id !== userId && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const responses = await storage.getUserQuestionResponses(userId, timelineId);
      res.json(responses);
    } catch (error) {
      console.error("Error getting user question responses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user-question-responses", isAuthenticated, async (req, res) => {
    try {
      const responseData = insertUserQuestionResponseSchema.parse(req.body);
      
      // Make sure users can only create responses for themselves (admins can create for anyone)
      if (req.user?.id !== responseData.userId && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const newResponse = await storage.createUserQuestionResponse(responseData);
      res.status(201).json(newResponse);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating user question response:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/user-question-responses/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid response ID" });
      }
      
      // Check if the response exists and belongs to the user
      const responses = await storage.getUserQuestionResponses(req.user!.id, req.body.timelineId);
      const userResponse = responses.find(r => r.id === id);
      
      if (!userResponse && !req.user?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedResponse = await storage.updateUserQuestionResponse(id, req.body);
      res.json(updatedResponse);
    } catch (error) {
      console.error("Error updating user question response:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Timeline Templates - Admin Only Routes
  app.get("/api/admin/timeline-templates", isAdmin, async (req, res) => {
    try {
      const templates = await storage.getTimelineTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error getting timeline templates:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/admin/timeline-templates/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const template = await storage.getTimelineTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error getting timeline template:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/admin/timeline-templates", isAdmin, async (req, res) => {
    try {
      const templateData = insertTimelineTemplateSchema.parse(req.body);
      const newTemplate = await storage.createTimelineTemplate(templateData);
      res.status(201).json(newTemplate);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating timeline template:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/admin/timeline-templates/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const template = await storage.getTimelineTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      const updatedTemplate = await storage.updateTimelineTemplate(id, req.body);
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating timeline template:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/admin/timeline-templates/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const success = await storage.deleteTimelineTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting timeline template:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Template Events
  app.get("/api/admin/template-events/:templateId", isAdmin, async (req, res) => {
    try {
      const templateId = parseInt(req.params.templateId);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const events = await storage.getTemplateEvents(templateId);
      res.json(events);
    } catch (error) {
      console.error("Error getting template events:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/admin/template-events", isAdmin, async (req, res) => {
    try {
      const eventData = insertTemplateEventSchema.parse(req.body);
      const newEvent = await storage.createTemplateEvent(eventData);
      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating template event:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/admin/template-events/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const event = await storage.getTemplateEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Template event not found" });
      }
      
      const updatedEvent = await storage.updateTemplateEvent(id, req.body);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating template event:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/admin/template-events/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const success = await storage.deleteTemplateEvent(id);
      if (!success) {
        return res.status(404).json({ message: "Template event not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template event:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // User-facing template routes
  app.get("/api/timeline-templates", async (req, res) => {
    try {
      // Allow non-admin users to see templates
      const templates = await storage.getTimelineTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error getting timeline templates:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Public endpoint for template events
  app.get("/api/template-events/:templateId", async (req, res) => {
    try {
      const templateId = parseInt(req.params.templateId);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const events = await storage.getTemplateEvents(templateId);
      res.json(events);
    } catch (error) {
      console.error("Error getting template events:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Route to apply a template to a timeline
  app.post("/api/timelines/:timelineId/apply-template", async (req, res) => {
    try {
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "You must be logged in to apply a template" });
      }
      
      const timelineId = parseInt(req.params.timelineId);
      const templateId = parseInt(req.body.templateId);
      
      if (isNaN(timelineId) || isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid timeline or template ID" });
      }
      
      // Check if timeline exists and belongs to user
      const timeline = await storage.getWeddingTimeline(timelineId);
      if (!timeline) {
        return res.status(404).json({ message: "Timeline not found" });
      }
      
      if (timeline.userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "You don't have permission to modify this timeline" });
      }
      
      // Get template events
      const templateEvents = await storage.getTemplateEvents(templateId);
      if (!templateEvents || templateEvents.length === 0) {
        return res.status(404).json({ message: "Template has no events" });
      }
      
      // Convert template events to timeline events
      const timelineEvents = await Promise.all(
        templateEvents.map(async (event) => {
          return await storage.createTimelineEvent({
            userId: req.user!.id,
            name: event.name,
            startTime: event.startTime,
            endTime: event.endTime,
            category: event.category,
            color: event.color,
            notes: event.notes,
            position: event.position,
            timelineId
          });
        })
      );
      
      res.status(200).json(timelineEvents);
    } catch (error) {
      console.error("Error applying template to timeline:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Route to delete all events in a timeline (Clear Timeline)
  app.delete("/api/timelines/:timelineId/events", isAuthenticated, async (req, res) => {
    try {
      const timelineId = parseInt(req.params.timelineId);
      
      if (isNaN(timelineId)) {
        return res.status(400).json({ message: "Invalid timeline ID" });
      }
      
      // Check if timeline exists and belongs to the user
      const timeline = await storage.getWeddingTimeline(timelineId);
      
      if (!timeline) {
        return res.status(404).json({ message: "Timeline not found" });
      }
      
      if (timeline.userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "You don't have permission to clear this timeline" });
      }
      
      // Get all events for this timeline
      const events = await storage.getTimelineEvents(timelineId);
      
      // Delete each event
      for (const event of events) {
        await storage.deleteTimelineEvent(event.id);
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error clearing timeline events:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Route to clear all timeline data (events, restrictions, responses)
  app.delete("/api/timelines/:timelineId/all-data", isAuthenticated, async (req, res) => {
    try {
      const timelineId = parseInt(req.params.timelineId);
      
      if (isNaN(timelineId)) {
        return res.status(400).json({ message: "Invalid timeline ID" });
      }
      
      // Check if timeline exists and belongs to the user
      const timeline = await storage.getWeddingTimeline(timelineId);
      
      if (!timeline) {
        return res.status(404).json({ message: "Timeline not found" });
      }
      
      if (timeline.userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "You don't have permission to clear this timeline" });
      }
      
      // 1. Delete all timeline events - if any exist
      try {
        const events = await storage.getTimelineEvents(timelineId);
        if (events && events.length > 0) {
          for (const event of events) {
            await storage.deleteTimelineEvent(event.id);
          }
        }
        console.log(`Events deleted or none existed for timeline ${timelineId}`);
      } catch (err) {
        console.error(`Error deleting events for timeline ${timelineId}:`, err);
        // Continue with other deletions anyway
      }
      
      // 2. Delete venue restrictions if they exist
      try {
        const venueRestriction = await storage.getVenueRestriction(timelineId);
        if (venueRestriction) {
          await db.delete(venueRestrictions).where(eq(venueRestrictions.timelineId, timelineId));
          console.log(`Deleted venue restrictions for timeline ${timelineId}`);
        }
      } catch (err) {
        console.error(`Error deleting venue restrictions for timeline ${timelineId}:`, err);
        // Continue anyway
      }
      
      // 3. Delete user question responses for this timeline
      try {
        if (timeline.userId) {
          const responses = await storage.getUserQuestionResponses(timeline.userId, timelineId);
          if (responses && responses.length > 0) {
            await db.delete(userQuestionResponses)
              .where(and(
                eq(userQuestionResponses.userId, timeline.userId), 
                eq(userQuestionResponses.timelineId, timelineId)
              ));
            console.log(`Deleted user question responses for timeline ${timelineId}`);
          }
        }
      } catch (err) {
        console.error(`Error deleting user question responses for timeline ${timelineId}:`, err);
        // Continue anyway
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error clearing all timeline data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Route to delete a timeline
  app.delete("/api/timelines/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Check if timeline exists and belongs to the user
      const timeline = await storage.getWeddingTimeline(id);
      
      if (!timeline) {
        return res.status(404).json({ message: "Timeline not found" });
      }
      
      if (timeline.userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "You don't have permission to delete this timeline" });
      }
      
      const success = await storage.deleteWeddingTimeline(id);
      
      if (success) {
        return res.status(204).send();
      } else {
        return res.status(500).json({ message: "Failed to delete timeline" });
      }
    } catch (error) {
      console.error("Error deleting timeline:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Password Reset Routes
  app.post("/api/password-reset/request", async (req, res) => {
    try {
      const { email } = req.body;
      
      console.log(`Password reset requested for email: ${email}`);
      
      if (!email) {
        console.log('Email is required but not provided');
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`User not found for email: ${email}`);
        // For security reasons, don't reveal if the email exists or not
        return res.status(200).json({ 
          message: "If your email is registered, you will receive a password reset link shortly" 
        });
      }
      
      console.log(`User found for email ${email}, generating reset token`);
      
      // Generate a secure random token
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      
      // Set expiry time to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      
      // Save the token in the database
      await storage.createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
        used: false
      });
      
      // Get the host from request or use a fallback for development/testing
      const host = req.get('host') || 'localhost:5000';
      
      // Construct the reset URL - ensure it's using https in production
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol || 'http';
      const resetUrl = `${protocol}://${host}/reset-password`;
      
      console.log(`Reset URL generated: ${resetUrl}`);
      
      // Attempt to send the email
      console.log(`Attempting to send password reset email to: ${email}`);
      let emailSent = false;
      
      // Always attempt to send the actual email using SendGrid
      // But log the reset URL info in development mode for debugging
      if (process.env.NODE_ENV !== 'production') {
        console.log('==== PASSWORD RESET INFORMATION ====');
        console.log(`Email: ${email}`);
        console.log(`Username: ${user.username}`);
        console.log(`Token: ${token}`);
        console.log(`Reset URL: ${resetUrl}?token=${token}`);
        console.log('====================================');
      }
      
      // Use the actual SendGrid service
      emailSent = await sendPasswordResetEmail(email, token, resetUrl, user.username);
      
      if (!emailSent) {
        console.error(`Failed to send password reset email to: ${email}`);
        return res.status(500).json({ message: "Failed to send password reset email. Please try again later or contact support." });
      }
      
      console.log(`Password reset email handled successfully for: ${email}`);
      
      // Return success response
      res.status(200).json({ 
        message: "If your email is registered, you will receive a password reset link shortly" 
      });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/password-reset/reset", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      // Check if the token exists and is valid
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken || resetToken.used) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      // Check if token is expired
      const now = new Date();
      if (now > resetToken.expiresAt) {
        return res.status(400).json({ message: "Token has expired" });
      }
      
      // Hash the new password
      const crypto = await import('crypto');
      const { promisify } = await import('util');
      const scryptAsync = promisify(crypto.scrypt);
      
      const salt = crypto.randomBytes(16).toString('hex');
      const buf = (await scryptAsync(newPassword, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString('hex')}.${salt}`;
      
      // Update the user's password
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      
      // Mark the token as used
      await storage.invalidatePasswordResetToken(token);
      
      res.status(200).json({ message: "Password has been successfully reset" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Email Templates API (Admin only)
  
  // Get all email templates
  app.get("/api/email-templates", isAdmin, async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error getting email templates:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get email templates by type
  app.get("/api/email-templates/type/:type", isAdmin, async (req, res) => {
    try {
      const { type } = req.params;
      const templates = await storage.getEmailTemplatesByType(type);
      res.json(templates);
    } catch (error) {
      console.error("Error getting email templates by type:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get a specific email template
  app.get("/api/email-templates/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const template = await storage.getEmailTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error getting email template:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create a new email template
  app.post("/api/email-templates", isAdmin, async (req, res) => {
    try {
      const templateData = insertEmailTemplateSchema.parse(req.body);
      const newTemplate = await storage.createEmailTemplate(templateData);
      res.status(201).json(newTemplate);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating email template:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update an email template
  app.put("/api/email-templates/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const existingTemplate = await storage.getEmailTemplate(id);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      const updatedTemplate = await storage.updateEmailTemplate(id, req.body);
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating email template:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete an email template
  app.delete("/api/email-templates/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const existingTemplate = await storage.getEmailTemplate(id);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Email template not found" });
      }
      
      // Don't allow deleting the default template
      if (existingTemplate.isDefault) {
        return res.status(400).json({ message: "Cannot delete the default template" });
      }
      
      const success = await storage.deleteEmailTemplate(id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete template" });
      }
    } catch (error) {
      console.error("Error deleting email template:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // App Settings Routes - only accessible by admin
  
  // Get all app settings (optionally filtered by category)
  app.get("/api/app-settings", isAdmin, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const settings = await storage.getAppSettings(category);
      res.json(settings);
    } catch (error) {
      console.error("Error getting app settings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get a specific app setting by key
  app.get("/api/app-settings/:key", isAdmin, async (req, res) => {
    try {
      const key = req.params.key;
      const setting = await storage.getAppSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error getting app setting:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create or update an app setting
  app.post("/api/app-settings", isAdmin, async (req, res) => {
    try {
      const settingData = insertAppSettingSchema.parse(req.body);
      const setting = await storage.setAppSetting(
        settingData.key,
        settingData.value,
        settingData.description || '',  // Provide empty string as fallback
        settingData.category
      );
      res.status(201).json(setting);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating/updating app setting:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update an app setting
  app.put("/api/app-settings/:key", isAdmin, async (req, res) => {
    try {
      const key = req.params.key;
      const existingSetting = await storage.getAppSetting(key);
      
      if (!existingSetting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      const updatedSetting = await storage.updateAppSetting(
        key,
        req.body.value,
        req.body.description || existingSetting.description,
        req.body.category || existingSetting.category
      );
      res.json(updatedSetting);
    } catch (error) {
      console.error("Error updating app setting:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete an app setting
  app.delete("/api/app-settings/:key", isAdmin, async (req, res) => {
    try {
      const key = req.params.key;
      const existingSetting = await storage.getAppSetting(key);
      
      if (!existingSetting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      await storage.deleteAppSetting(key);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting app setting:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Share timeline route
  app.post("/api/timelines/:timelineId/share", isAuthenticated, async (req, res) => {
    try {
      const timelineId = parseInt(req.params.timelineId);
      
      if (isNaN(timelineId)) {
        return res.status(400).json({ message: "Invalid timeline ID" });
      }
      
      // Check if timeline exists and belongs to the user
      const timeline = await storage.getWeddingTimeline(timelineId);
      
      if (!timeline) {
        return res.status(404).json({ message: "Timeline not found" });
      }
      
      if (timeline.userId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "You don't have permission to share this timeline" });
      }
      
      // Generate a unique share token
      const shareToken = crypto.randomBytes(32).toString('hex');
      
      // Store the share token in the database
      await storage.createShareToken({
        timelineId,
        token: shareToken,
        createdBy: req.user!.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      });
      
      // Return the share URL
      const shareUrl = `${process.env.FRONTEND_URL}/share/${timelineId}/${shareToken}`;
      res.json({ shareUrl });
    } catch (error) {
      console.error("Error generating share link:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // View shared timeline route
  app.get("/api/timelines/share/:timelineId/:token", async (req, res) => {
    try {
      const timelineId = parseInt(req.params.timelineId);
      const token = req.params.token;
      
      if (isNaN(timelineId)) {
        return res.status(400).json({ message: "Invalid timeline ID" });
      }
      
      // Verify the share token
      const shareToken = await storage.getShareToken(token);
      
      if (!shareToken || shareToken.timelineId !== timelineId) {
        return res.status(404).json({ message: "Invalid or expired share link" });
      }
      
      if (shareToken.expiresAt < new Date()) {
        return res.status(410).json({ message: "Share link has expired" });
      }
      
      // Get the timeline data
      const timeline = await storage.getWeddingTimeline(timelineId);
      if (!timeline) {
        return res.status(404).json({ message: "Timeline not found" });
      }
      
      // Get the timeline events
      const events = await storage.getTimelineEvents(timelineId);
      
      // Get venue restrictions
      const restrictions = await storage.getVenueRestriction(timelineId);
      
      res.json({
        timeline,
        events,
        restrictions,
        isShared: true
      });
    } catch (error) {
      console.error("Error viewing shared timeline:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
