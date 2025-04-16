import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(), // Format HH:MM
  endTime: text("end_time").notNull(), // Format HH:MM
  category: text("category").notNull(),
  color: text("color").notNull(),
  notes: text("notes"),
  position: integer("position").notNull(),
});

export const insertTimelineEventSchema = createInsertSchema(timelineEvents)
  .omit({ id: true })
  .pick({
    userId: true,
    name: true,
    startTime: true,
    endTime: true,
    category: true,
    color: true,
    notes: true,
    position: true,
  });

export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
export type TimelineEvent = typeof timelineEvents.$inferSelect;

export const weddingTimelines = pgTable("wedding_timelines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  weddingDate: text("wedding_date").notNull(),
  startHour: integer("start_hour").notNull(),
  timeFormat: text("time_format").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWeddingTimelineSchema = createInsertSchema(weddingTimelines)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .pick({
    userId: true,
    name: true,
    weddingDate: true,
    startHour: true,
    timeFormat: true,
  });

export type InsertWeddingTimeline = z.infer<typeof insertWeddingTimelineSchema>;
export type WeddingTimeline = typeof weddingTimelines.$inferSelect;

export const venueRestrictions = pgTable("venue_restrictions", {
  id: serial("id").primaryKey(),
  timelineId: integer("timeline_id").references(() => weddingTimelines.id),
  musicEndTime: text("music_end_time"),
  ceremonyStartTime: text("ceremony_start_time"),
  dinnerStartTime: text("dinner_start_time"),
  showRestrictionLines: boolean("show_restriction_lines").default(true),
});

export const insertVenueRestrictionSchema = createInsertSchema(venueRestrictions)
  .omit({ id: true })
  .pick({
    timelineId: true,
    musicEndTime: true,
    ceremonyStartTime: true,
    dinnerStartTime: true,
    showRestrictionLines: true,
  });

export type InsertVenueRestriction = z.infer<typeof insertVenueRestrictionSchema>;
export type VenueRestriction = typeof venueRestrictions.$inferSelect;
