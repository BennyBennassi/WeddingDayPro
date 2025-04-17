import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true })
  .pick({
    username: true,
    password: true,
    email: true,
    name: true,
    isAdmin: true,
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  timelineId: integer("timeline_id").references(() => weddingTimelines.id),
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
    timelineId: true,
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
  weddingOf: text("wedding_of"),
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
    weddingOf: true,
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
  customRestrictionTime: text("custom_restriction_time"),
  customRestrictionName: text("custom_restriction_name"),
  showRestrictionLines: boolean("show_restriction_lines").default(true),
});

export const insertVenueRestrictionSchema = createInsertSchema(venueRestrictions)
  .omit({ id: true })
  .pick({
    timelineId: true,
    musicEndTime: true,
    ceremonyStartTime: true,
    dinnerStartTime: true,
    customRestrictionTime: true,
    customRestrictionName: true,
    showRestrictionLines: true,
  });

export type InsertVenueRestriction = z.infer<typeof insertVenueRestrictionSchema>;
export type VenueRestriction = typeof venueRestrictions.$inferSelect;

// Timeline Question Templates Table (for admins to create questions)
export const timelineQuestions = pgTable("timeline_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  order: integer("order").default(0).notNull(),
  // Fields to prefill when user answers yes
  defaultName: text("default_name"),
  defaultCategory: text("default_category"),
  defaultStartTime: text("default_start_time"),
  defaultEndTime: text("default_end_time"),
  defaultColor: text("default_color"),
  defaultNotes: text("default_notes"),
  // Fields to prompt the user for (true = ask user, false = use default)
  promptName: boolean("prompt_name").default(true).notNull(),
  promptCategory: boolean("prompt_category").default(false).notNull(),
  promptStartTime: boolean("prompt_start_time").default(true).notNull(),
  promptEndTime: boolean("prompt_end_time").default(true).notNull(),
  promptColor: boolean("prompt_color").default(false).notNull(),
  promptNotes: boolean("prompt_notes").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTimelineQuestionSchema = createInsertSchema(timelineQuestions)
  .omit({ id: true, createdAt: true })
  .pick({
    question: true,
    description: true,
    active: true,
    order: true,
    defaultName: true,
    defaultCategory: true,
    defaultStartTime: true,
    defaultEndTime: true,
    defaultColor: true,
    defaultNotes: true,
    promptName: true,
    promptCategory: true,
    promptStartTime: true,
    promptEndTime: true,
    promptColor: true,
    promptNotes: true,
  });

export type InsertTimelineQuestion = z.infer<typeof insertTimelineQuestionSchema>;
export type TimelineQuestion = typeof timelineQuestions.$inferSelect;

// User Question Responses Table (tracks user's answers)
export const userQuestionResponses = pgTable("user_question_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  timelineId: integer("timeline_id").references(() => weddingTimelines.id).notNull(),
  questionId: integer("question_id").references(() => timelineQuestions.id).notNull(),
  answer: boolean("answer").default(false).notNull(), // yes/no response
  completed: boolean("completed").default(false).notNull(), // whether user completed follow-up inputs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserQuestionResponseSchema = createInsertSchema(userQuestionResponses)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .pick({
    userId: true,
    timelineId: true,
    questionId: true,
    answer: true,
    completed: true,
  });

export type InsertUserQuestionResponse = z.infer<typeof insertUserQuestionResponseSchema>;
export type UserQuestionResponse = typeof userQuestionResponses.$inferSelect;

// Timeline Templates Table (for admins to create reusable timeline templates)
export const timelineTemplates = pgTable("timeline_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTimelineTemplateSchema = createInsertSchema(timelineTemplates)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .pick({
    name: true,
    description: true,
    isDefault: true,
  });

export type InsertTimelineTemplate = z.infer<typeof insertTimelineTemplateSchema>;
export type TimelineTemplate = typeof timelineTemplates.$inferSelect;

// Timeline Template Events (events associated with a template)
export const templateEvents = pgTable("template_events", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => timelineTemplates.id).notNull(),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(), // Format HH:MM
  endTime: text("end_time").notNull(), // Format HH:MM
  category: text("category").notNull(),
  color: text("color").notNull(),
  notes: text("notes"),
  position: integer("position").notNull(),
});

export const insertTemplateEventSchema = createInsertSchema(templateEvents)
  .omit({ id: true })
  .pick({
    templateId: true,
    name: true,
    startTime: true,
    endTime: true,
    category: true,
    color: true,
    notes: true,
    position: true,
  });

export type InsertTemplateEvent = z.infer<typeof insertTemplateEventSchema>;
export type TemplateEvent = typeof templateEvents.$inferSelect;
