import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTimelineEventSchema, insertWeddingTimelineSchema, insertVenueRestrictionSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
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
  
  const httpServer = createServer(app);
  return httpServer;
}
