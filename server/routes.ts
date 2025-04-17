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
  insertTemplateEventSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";

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
      const eventData = insertTimelineEventSchema.parse(req.body);
      const newEvent = await storage.createTimelineEvent(eventData);
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
      
      const success = await storage.deleteWeddingTimeline(id);
      if (!success) {
        return res.status(404).json({ message: "Timeline not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting wedding timeline:", error);
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
  
  // Route to apply a template to a timeline
  app.post("/api/timelines/:timelineId/apply-template", isAuthenticated, async (req, res) => {
    try {
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
            timelineId,
            name: event.name,
            startTime: event.startTime,
            endTime: event.endTime,
            category: event.category,
            color: event.color,
            notes: event.notes,
            position: event.position,
          });
        })
      );
      
      res.status(200).json(timelineEvents);
    } catch (error) {
      console.error("Error applying template to timeline:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
