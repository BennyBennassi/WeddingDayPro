import { 
  type User, 
  type InsertUser, 
  type TimelineEvent, 
  type InsertTimelineEvent,
  type WeddingTimeline,
  type InsertWeddingTimeline,
  type VenueRestriction,
  type InsertVenueRestriction
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Timeline Event operations
  getTimelineEvents(timelineId: number): Promise<TimelineEvent[]>;
  getTimelineEvent(id: number): Promise<TimelineEvent | undefined>;
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
  updateTimelineEvent(id: number, event: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined>;
  deleteTimelineEvent(id: number): Promise<boolean>;
  
  // Wedding Timeline operations
  getWeddingTimelines(userId: number): Promise<WeddingTimeline[]>;
  getWeddingTimeline(id: number): Promise<WeddingTimeline | undefined>;
  createWeddingTimeline(timeline: InsertWeddingTimeline): Promise<WeddingTimeline>;
  updateWeddingTimeline(id: number, timeline: Partial<InsertWeddingTimeline>): Promise<WeddingTimeline | undefined>;
  deleteWeddingTimeline(id: number): Promise<boolean>;
  
  // Venue Restriction operations
  getVenueRestriction(timelineId: number): Promise<VenueRestriction | undefined>;
  createVenueRestriction(restriction: InsertVenueRestriction): Promise<VenueRestriction>;
  updateVenueRestriction(timelineId: number, restriction: Partial<InsertVenueRestriction>): Promise<VenueRestriction | undefined>;
}

import { db } from "./db";
import { 
  users, 
  timelineEvents, 
  weddingTimelines, 
  venueRestrictions,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Timeline Event methods
  async getTimelineEvents(timelineId: number): Promise<TimelineEvent[]> {
    const timeline = await this.getWeddingTimeline(timelineId);
    if (!timeline) return [];
    
    return db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.userId, timeline.userId))
      .orderBy(timelineEvents.position);
  }
  
  async getTimelineEvent(id: number): Promise<TimelineEvent | undefined> {
    const [event] = await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.id, id));
    return event;
  }
  
  async createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent> {
    const [timelineEvent] = await db
      .insert(timelineEvents)
      .values({
        ...event,
        userId: event.userId ?? null,
        notes: event.notes ?? null,
      })
      .returning();
    return timelineEvent;
  }
  
  async updateTimelineEvent(id: number, event: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined> {
    const [updatedEvent] = await db
      .update(timelineEvents)
      .set({
        ...event,
        userId: event.userId !== undefined ? (event.userId ?? null) : undefined,
        notes: event.notes !== undefined ? (event.notes ?? null) : undefined,
      })
      .where(eq(timelineEvents.id, id))
      .returning();
    return updatedEvent;
  }
  
  async deleteTimelineEvent(id: number): Promise<boolean> {
    await db
      .delete(timelineEvents)
      .where(eq(timelineEvents.id, id));
    return true; // Drizzle doesn't return count directly
  }
  
  // Wedding Timeline methods
  async getWeddingTimelines(userId: number): Promise<WeddingTimeline[]> {
    return db
      .select()
      .from(weddingTimelines)
      .where(eq(weddingTimelines.userId, userId));
  }
  
  async getWeddingTimeline(id: number): Promise<WeddingTimeline | undefined> {
    const [timeline] = await db
      .select()
      .from(weddingTimelines)
      .where(eq(weddingTimelines.id, id));
    return timeline;
  }
  
  async createWeddingTimeline(timeline: InsertWeddingTimeline): Promise<WeddingTimeline> {
    const [weddingTimeline] = await db
      .insert(weddingTimelines)
      .values({
        ...timeline,
        userId: timeline.userId ?? null,
      })
      .returning();
    return weddingTimeline;
  }
  
  async updateWeddingTimeline(id: number, timeline: Partial<InsertWeddingTimeline>): Promise<WeddingTimeline | undefined> {
    const [updatedTimeline] = await db
      .update(weddingTimelines)
      .set({
        ...timeline,
        userId: timeline.userId !== undefined ? (timeline.userId ?? null) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(weddingTimelines.id, id))
      .returning();
    return updatedTimeline;
  }
  
  async deleteWeddingTimeline(id: number): Promise<boolean> {
    await db
      .delete(weddingTimelines)
      .where(eq(weddingTimelines.id, id));
    return true;
  }
  
  // Venue Restriction methods
  async getVenueRestriction(timelineId: number): Promise<VenueRestriction | undefined> {
    const [restriction] = await db
      .select()
      .from(venueRestrictions)
      .where(eq(venueRestrictions.timelineId, timelineId));
    return restriction;
  }
  
  async createVenueRestriction(restriction: InsertVenueRestriction): Promise<VenueRestriction> {
    const [venueRestriction] = await db
      .insert(venueRestrictions)
      .values({
        ...restriction,
        timelineId: restriction.timelineId ?? null,
        musicEndTime: restriction.musicEndTime ?? null,
        ceremonyStartTime: restriction.ceremonyStartTime ?? null,
        dinnerStartTime: restriction.dinnerStartTime ?? null,
      })
      .returning();
    return venueRestriction;
  }
  
  async updateVenueRestriction(timelineId: number, restriction: Partial<InsertVenueRestriction>): Promise<VenueRestriction | undefined> {
    const [existingRestriction] = await db
      .select()
      .from(venueRestrictions)
      .where(eq(venueRestrictions.timelineId, timelineId));
    
    if (!existingRestriction) {
      return undefined;
    }
    
    const [updatedRestriction] = await db
      .update(venueRestrictions)
      .set({
        timelineId: restriction.timelineId !== undefined ? (restriction.timelineId ?? null) : undefined,
        musicEndTime: restriction.musicEndTime !== undefined ? (restriction.musicEndTime ?? null) : undefined,
        ceremonyStartTime: restriction.ceremonyStartTime !== undefined ? (restriction.ceremonyStartTime ?? null) : undefined,
        dinnerStartTime: restriction.dinnerStartTime !== undefined ? (restriction.dinnerStartTime ?? null) : undefined,
      })
      .where(eq(venueRestrictions.id, existingRestriction.id))
      .returning();
    return updatedRestriction;
  }
}

// Initialize the storage with the database implementation
export const storage = new DatabaseStorage();

// Add default data if it doesn't exist yet
async function initializeDefaultData() {
  try {
    // Check if default user exists
    const existingUser = await storage.getUserByUsername('demo');
    
    if (!existingUser) {
      // Create default user
      const defaultUser = await storage.createUser({
        username: "demo",
        password: "password",
      });
      
      // Create default timeline
      const defaultTimeline = await storage.createWeddingTimeline({
        userId: defaultUser.id,
        name: "My Wedding",
        weddingDate: "2023-12-31",
        startHour: 6,
        timeFormat: "24h",
      });
      
      // Add some default timeline events
      const defaultEvents: InsertTimelineEvent[] = [
        {
          userId: defaultUser.id,
          name: "Hair & Makeup",
          startTime: "08:00",
          endTime: "12:00",
          category: "preparation",
          color: "bg-pink-100",
          notes: "Bride and bridesmaids",
          position: 1,
        },
        {
          userId: defaultUser.id,
          name: "Travel to Ceremony",
          startTime: "12:15",
          endTime: "12:30",
          category: "travel",
          color: "bg-blue-100",
          notes: "",
          position: 2,
        },
        {
          userId: defaultUser.id,
          name: "Ceremony",
          startTime: "12:30",
          endTime: "13:30",
          category: "ceremony",
          color: "bg-primary-light",
          notes: "",
          position: 3,
        },
        {
          userId: defaultUser.id,
          name: "Receiving Line",
          startTime: "13:30",
          endTime: "13:45",
          category: "custom",
          color: "bg-purple-100",
          notes: "",
          position: 4,
        },
        {
          userId: defaultUser.id,
          name: "Photos",
          startTime: "13:45",
          endTime: "15:30",
          category: "photos",
          color: "bg-green-100",
          notes: "Family, bridal party and couple photos",
          position: 5,
        },
      ];
      
      for (const event of defaultEvents) {
        await storage.createTimelineEvent(event);
      }
      
      // Add venue restrictions
      await storage.createVenueRestriction({
        timelineId: defaultTimeline.id,
        musicEndTime: "01:00",
        ceremonyStartTime: null,
        dinnerStartTime: "19:00",
      });
      
      console.log('Default data initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
}

// Call initialization (will only create data if it doesn't exist)
initializeDefaultData();
