import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import type { InferModel } from "drizzle-orm";

// Define base tables
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSelectedTimelineId: integer("last_selected_timeline_id"),
});

export const weddingTimelinesTable = pgTable("wedding_timelines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  weddingOf: text("wedding_of"),
  weddingCouple: text("wedding_couple"),
  weddingDate: text("wedding_date").notNull(),
  startHour: integer("start_hour").notNull(),
  timeFormat: text("time_format").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Define relations
export const userRelations = relations(usersTable, ({ one }) => ({
  selectedTimeline: one(weddingTimelinesTable, {
    fields: [usersTable.lastSelectedTimelineId],
    references: [weddingTimelinesTable.id],
  }),
}));

export const timelineRelations = relations(weddingTimelinesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [weddingTimelinesTable.userId],
    references: [usersTable.id],
  }),
}));

// Export table aliases
export const users = usersTable;
export const weddingTimelines = weddingTimelinesTable;

export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  timelineId: integer("timeline_id").references(() => weddingTimelinesTable.id, { onDelete: "cascade" }),
  category: text("category"),
  color: text("color"),
  notes: text("notes"),
  position: integer("position"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const venueRestrictions = pgTable("venue_restrictions", {
  id: serial("id").primaryKey(),
  timelineId: integer("timeline_id").references(() => weddingTimelinesTable.id),
  musicEndTime: text("music_end_time"),
  ceremonyStartTime: text("ceremony_start_time"),
  dinnerStartTime: text("dinner_start_time"),
  customRestrictionTime: text("custom_restriction_time"),
  customRestrictionName: text("custom_restriction_name"),
  showRestrictionLines: boolean("show_restriction_lines").default(true),
});

export const timelineQuestions = pgTable("timeline_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  order: integer("order").default(0).notNull(),
  defaultName: text("default_name"),
  defaultCategory: text("default_category"),
  defaultStartTime: text("default_start_time"),
  defaultEndTime: text("default_end_time"),
  defaultColor: text("default_color"),
  defaultNotes: text("default_notes"),
  promptName: boolean("prompt_name").default(true).notNull(),
  promptCategory: boolean("prompt_category").default(false).notNull(),
  promptStartTime: boolean("prompt_start_time").default(true).notNull(),
  promptEndTime: boolean("prompt_end_time").default(true).notNull(),
  promptColor: boolean("prompt_color").default(false).notNull(),
  promptNotes: boolean("prompt_notes").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userQuestionResponses = pgTable("user_question_responses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  timelineId: integer("timeline_id").references(() => weddingTimelinesTable.id).notNull(),
  questionId: integer("question_id").references(() => timelineQuestions.id).notNull(),
  answer: boolean("answer").default(false).notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const timelineTemplates = pgTable("timeline_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const templateEvents = pgTable("template_events", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => timelineTemplates.id).notNull(),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  category: text("category").notNull(),
  color: text("color").notNull(),
  notes: text("notes"),
  position: integer("position").notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  used: boolean("used").default(false).notNull(),
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  subject: text("subject").notNull(),
  htmlBody: text("html_body").notNull(),
  textBody: text("text_body").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appSettings = pgTable("app_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const shareTokens = pgTable('share_tokens', {
  id: serial('id').primaryKey(),
  timelineId: integer('timeline_id').notNull().references(() => weddingTimelinesTable.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  createdBy: integer('created_by').notNull().references(() => usersTable.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});

// Define insert schemas
export const insertUserSchema = createInsertSchema(usersTable, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertTimelineEventSchema = createInsertSchema(timelineEvents, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertAppSettingSchema = createInsertSchema(appSettings, {
  id: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Define types
export type User = InferModel<typeof usersTable>;
export type TimelineEvent = InferModel<typeof timelineEvents>;
export type WeddingTimeline = InferModel<typeof weddingTimelinesTable>;
export type VenueRestriction = InferModel<typeof venueRestrictions>;
export type TimelineQuestion = InferModel<typeof timelineQuestions>;
export type UserQuestionResponse = InferModel<typeof userQuestionResponses>;
export type TimelineTemplate = InferModel<typeof timelineTemplates>;
export type TemplateEvent = InferModel<typeof templateEvents>;
export type PasswordResetToken = InferModel<typeof passwordResetTokens>;
export type EmailTemplate = InferModel<typeof emailTemplates>;
export type AppSetting = InferModel<typeof appSettings>;
export type ShareToken = typeof shareTokens.$inferSelect;

// Define insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;
export type InsertWeddingTimeline = Omit<WeddingTimeline, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertVenueRestriction = Omit<VenueRestriction, 'id'>;
export type InsertTimelineQuestion = Omit<TimelineQuestion, 'id' | 'createdAt'>;
export type InsertUserQuestionResponse = Omit<UserQuestionResponse, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertTimelineTemplate = Omit<TimelineTemplate, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertTemplateEvent = Omit<TemplateEvent, 'id'>;
export type InsertPasswordResetToken = Omit<PasswordResetToken, 'id' | 'createdAt' | 'used'>;
export type InsertEmailTemplate = Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertAppSetting = Omit<AppSetting, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertShareToken = typeof shareTokens.$inferInsert;
