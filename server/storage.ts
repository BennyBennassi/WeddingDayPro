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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private timelineEvents: Map<number, TimelineEvent>;
  private weddingTimelines: Map<number, WeddingTimeline>;
  private venueRestrictions: Map<number, VenueRestriction>;
  
  private currentUserId: number;
  private currentTimelineEventId: number;
  private currentWeddingTimelineId: number;
  private currentVenueRestrictionId: number;

  constructor() {
    this.users = new Map();
    this.timelineEvents = new Map();
    this.weddingTimelines = new Map();
    this.venueRestrictions = new Map();
    
    this.currentUserId = 1;
    this.currentTimelineEventId = 1;
    this.currentWeddingTimelineId = 1;
    this.currentVenueRestrictionId = 1;
    
    // Add a default user and example timeline for quicker testing
    const defaultUser: User = {
      id: this.currentUserId++,
      username: "demo",
      password: "password",
    };
    this.users.set(defaultUser.id, defaultUser);
    
    const defaultTimeline: WeddingTimeline = {
      id: this.currentWeddingTimelineId++,
      userId: defaultUser.id,
      name: "My Wedding",
      weddingDate: "2023-12-31",
      startHour: 6,
      timeFormat: "24h",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.weddingTimelines.set(defaultTimeline.id, defaultTimeline);
    
    // Add some default timeline events based on the article
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
      {
        userId: defaultUser.id,
        name: "Travel to Reception",
        startTime: "15:30",
        endTime: "16:00",
        category: "travel",
        color: "bg-blue-100",
        notes: "",
        position: 6,
      },
      {
        userId: defaultUser.id,
        name: "Drinks Reception",
        startTime: "16:00",
        endTime: "17:30",
        category: "entertainment",
        color: "bg-yellow-100",
        notes: "",
        position: 7,
      },
      {
        userId: defaultUser.id,
        name: "Dinner Call",
        startTime: "17:30",
        endTime: "18:00",
        category: "food",
        color: "bg-orange-100",
        notes: "",
        position: 8,
      },
      {
        userId: defaultUser.id,
        name: "Speeches",
        startTime: "18:00",
        endTime: "18:30",
        category: "entertainment",
        color: "bg-accent-light",
        notes: "",
        position: 9,
      },
      {
        userId: defaultUser.id,
        name: "Dinner Service",
        startTime: "18:30",
        endTime: "20:30",
        category: "food",
        color: "bg-red-100",
        notes: "",
        position: 10,
      },
      {
        userId: defaultUser.id,
        name: "Band Setup",
        startTime: "20:30",
        endTime: "21:30",
        category: "entertainment",
        color: "bg-gray-200",
        notes: "",
        position: 11,
      },
      {
        userId: defaultUser.id,
        name: "Band",
        startTime: "21:30",
        endTime: "00:00",
        category: "entertainment",
        color: "bg-indigo-100",
        notes: "",
        position: 12,
      },
      {
        userId: defaultUser.id,
        name: "DJ",
        startTime: "00:00",
        endTime: "02:00",
        category: "entertainment",
        color: "bg-indigo-100",
        notes: "",
        position: 13,
      },
      {
        userId: defaultUser.id,
        name: "Residence Bar",
        startTime: "03:00",
        endTime: "05:00",
        category: "entertainment",
        color: "bg-teal-100",
        notes: "Late night drinks",
        position: 14,
      },
    ];
    
    for (const event of defaultEvents) {
      const newEvent = {
        ...event,
        id: this.currentTimelineEventId++,
      };
      this.timelineEvents.set(newEvent.id, newEvent);
    }
    
    // Add venue restrictions
    const defaultRestriction: VenueRestriction = {
      id: this.currentVenueRestrictionId++,
      timelineId: defaultTimeline.id,
      musicEndTime: "01:00",
      ceremonyStartTime: null,
      dinnerStartTime: "19:00",
    };
    this.venueRestrictions.set(defaultRestriction.id, defaultRestriction);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Timeline Event methods
  async getTimelineEvents(timelineId: number): Promise<TimelineEvent[]> {
    return Array.from(this.timelineEvents.values())
      .filter(event => this.weddingTimelines.get(timelineId)?.userId === event.userId)
      .sort((a, b) => a.position - b.position);
  }
  
  async getTimelineEvent(id: number): Promise<TimelineEvent | undefined> {
    return this.timelineEvents.get(id);
  }
  
  async createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent> {
    const id = this.currentTimelineEventId++;
    const timelineEvent: TimelineEvent = { ...event, id };
    this.timelineEvents.set(id, timelineEvent);
    return timelineEvent;
  }
  
  async updateTimelineEvent(id: number, event: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined> {
    const existingEvent = this.timelineEvents.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent = { ...existingEvent, ...event };
    this.timelineEvents.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteTimelineEvent(id: number): Promise<boolean> {
    return this.timelineEvents.delete(id);
  }
  
  // Wedding Timeline methods
  async getWeddingTimelines(userId: number): Promise<WeddingTimeline[]> {
    return Array.from(this.weddingTimelines.values())
      .filter(timeline => timeline.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async getWeddingTimeline(id: number): Promise<WeddingTimeline | undefined> {
    return this.weddingTimelines.get(id);
  }
  
  async createWeddingTimeline(timeline: InsertWeddingTimeline): Promise<WeddingTimeline> {
    const id = this.currentWeddingTimelineId++;
    const now = new Date();
    const weddingTimeline: WeddingTimeline = { 
      ...timeline, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.weddingTimelines.set(id, weddingTimeline);
    return weddingTimeline;
  }
  
  async updateWeddingTimeline(id: number, timeline: Partial<InsertWeddingTimeline>): Promise<WeddingTimeline | undefined> {
    const existingTimeline = this.weddingTimelines.get(id);
    if (!existingTimeline) return undefined;
    
    const updatedTimeline = { 
      ...existingTimeline, 
      ...timeline,
      updatedAt: new Date()
    };
    this.weddingTimelines.set(id, updatedTimeline);
    return updatedTimeline;
  }
  
  async deleteWeddingTimeline(id: number): Promise<boolean> {
    return this.weddingTimelines.delete(id);
  }
  
  // Venue Restriction methods
  async getVenueRestriction(timelineId: number): Promise<VenueRestriction | undefined> {
    return Array.from(this.venueRestrictions.values())
      .find(restriction => restriction.timelineId === timelineId);
  }
  
  async createVenueRestriction(restriction: InsertVenueRestriction): Promise<VenueRestriction> {
    const id = this.currentVenueRestrictionId++;
    const venueRestriction: VenueRestriction = { ...restriction, id };
    this.venueRestrictions.set(id, venueRestriction);
    return venueRestriction;
  }
  
  async updateVenueRestriction(timelineId: number, restriction: Partial<InsertVenueRestriction>): Promise<VenueRestriction | undefined> {
    const existingRestriction = Array.from(this.venueRestrictions.values())
      .find(r => r.timelineId === timelineId);
      
    if (!existingRestriction) return undefined;
    
    const updatedRestriction = { ...existingRestriction, ...restriction };
    this.venueRestrictions.set(existingRestriction.id, updatedRestriction);
    return updatedRestriction;
  }
}

export const storage = new MemStorage();
