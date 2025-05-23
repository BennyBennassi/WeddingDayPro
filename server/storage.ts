import { 
  type User, 
  type InsertUser, 
  type TimelineEvent, 
  type InsertTimelineEvent,
  type WeddingTimeline,
  type InsertWeddingTimeline,
  type VenueRestriction,
  type InsertVenueRestriction,
  type TimelineQuestion,
  type InsertTimelineQuestion,
  type UserQuestionResponse,
  type InsertUserQuestionResponse,
  type TimelineTemplate,
  type InsertTimelineTemplate,
  type TemplateEvent,
  type InsertTemplateEvent,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type EmailTemplate,
  type InsertEmailTemplate,
  type AppSetting,
  type InsertAppSetting
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
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
  
  // Timeline Question operations
  getTimelineQuestions(active?: boolean): Promise<TimelineQuestion[]>;
  getTimelineQuestion(id: number): Promise<TimelineQuestion | undefined>;
  createTimelineQuestion(question: InsertTimelineQuestion): Promise<TimelineQuestion>;
  updateTimelineQuestion(id: number, question: Partial<InsertTimelineQuestion>): Promise<TimelineQuestion | undefined>;
  deleteTimelineQuestion(id: number): Promise<boolean>;
  
  // User Question Response operations
  getUserQuestionResponses(userId: number, timelineId: number): Promise<UserQuestionResponse[]>;
  createUserQuestionResponse(response: InsertUserQuestionResponse): Promise<UserQuestionResponse>;
  updateUserQuestionResponse(id: number, response: Partial<InsertUserQuestionResponse>): Promise<UserQuestionResponse | undefined>;
  
  // Timeline Template operations
  getTimelineTemplates(): Promise<TimelineTemplate[]>;
  getTimelineTemplate(id: number): Promise<TimelineTemplate | undefined>;
  createTimelineTemplate(template: InsertTimelineTemplate): Promise<TimelineTemplate>;
  updateTimelineTemplate(id: number, template: Partial<InsertTimelineTemplate>): Promise<TimelineTemplate | undefined>;
  deleteTimelineTemplate(id: number): Promise<boolean>;
  
  // Template Event operations
  getTemplateEvents(templateId: number): Promise<TemplateEvent[]>;
  getTemplateEvent(id: number): Promise<TemplateEvent | undefined>;
  createTemplateEvent(event: InsertTemplateEvent): Promise<TemplateEvent>;
  updateTemplateEvent(id: number, event: Partial<InsertTemplateEvent>): Promise<TemplateEvent | undefined>;
  deleteTemplateEvent(id: number): Promise<boolean>;
  
  // Password Reset operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  invalidatePasswordResetToken(token: string): Promise<boolean>;
  
  // Email Template operations
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplatesByType(type: string): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  getDefaultEmailTemplate(type: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;
  
  // App Settings operations
  getAppSettings(category?: string): Promise<AppSetting[]>;
  getAppSetting(key: string): Promise<AppSetting | null>;
  setAppSetting(key: string, value: unknown, description: string, category: string): Promise<AppSetting>;
  updateAppSetting(key: string, value: unknown, description: string, category: string): Promise<AppSetting>;
  deleteAppSetting(key: string): Promise<void>;
  
  // Last Selected Timeline operations
  updateUserLastSelectedTimeline(userId: number, timelineId: number): Promise<void>;
  getUserLastSelectedTimeline(userId: number): Promise<number | null>;
}

import { db } from "./db";
import { 
  users, 
  timelineEvents, 
  weddingTimelines, 
  venueRestrictions,
  timelineQuestions,
  userQuestionResponses,
  timelineTemplates,
  templateEvents,
  passwordResetTokens,
  emailTemplates,
  appSettings
} from "@shared/schema";
import { eq, and, ne, not, inArray } from "drizzle-orm";
import { pool } from "./db";

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
  
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // First, get all timelines for this user
    const userTimelines = await this.getWeddingTimelines(id);
    
    // For each timeline, delete related data
    for (const timeline of userTimelines) {
      // Delete venue restrictions for this timeline
      const venueRestriction = await this.getVenueRestriction(timeline.id);
      if (venueRestriction) {
        await db.delete(venueRestrictions)
          .where(eq(venueRestrictions.timelineId, timeline.id));
      }
      
      // Delete user question responses for this user and timeline
      await db.delete(userQuestionResponses)
        .where(and(
          eq(userQuestionResponses.userId, id),
          eq(userQuestionResponses.timelineId, timeline.id)
        ));
    }
    
    // Delete all timeline events for this user
    await db.delete(timelineEvents)
      .where(eq(timelineEvents.userId, id));
      
    // Delete all timelines for this user
    await db.delete(weddingTimelines)
      .where(eq(weddingTimelines.userId, id));
    
    // Finally, delete the user
    await db.delete(users)
      .where(eq(users.id, id));
      
    return true;
  }
  
  // Timeline Event methods
  async getTimelineEvents(timelineId: number): Promise<TimelineEvent[]> {
    const timeline = await this.getWeddingTimeline(timelineId);
    if (!timeline || timeline.userId === null) return [];
    
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
        customRestrictionTime: restriction.customRestrictionTime ?? null,
        customRestrictionName: restriction.customRestrictionName ?? null,
        showRestrictionLines: restriction.showRestrictionLines ?? true,
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
        customRestrictionTime: restriction.customRestrictionTime !== undefined ? (restriction.customRestrictionTime ?? null) : undefined,
        customRestrictionName: restriction.customRestrictionName !== undefined ? (restriction.customRestrictionName ?? null) : undefined,
        showRestrictionLines: restriction.showRestrictionLines !== undefined ? restriction.showRestrictionLines : undefined,
      })
      .where(eq(venueRestrictions.id, existingRestriction.id))
      .returning();
    return updatedRestriction;
  }
  
  // Timeline Question methods
  async getTimelineQuestions(active?: boolean): Promise<TimelineQuestion[]> {
    const query = db.select().from(timelineQuestions);
    
    if (active !== undefined) {
      return query.where(eq(timelineQuestions.active, active)).orderBy(timelineQuestions.order);
    }
    
    return query.orderBy(timelineQuestions.order);
  }
  
  async getTimelineQuestion(id: number): Promise<TimelineQuestion | undefined> {
    const [question] = await db
      .select()
      .from(timelineQuestions)
      .where(eq(timelineQuestions.id, id));
    return question;
  }
  
  async updateTimelineQuestion(id: number, question: Partial<InsertTimelineQuestion>): Promise<TimelineQuestion | undefined> {
    const [updatedQuestion] = await db
      .update(timelineQuestions)
      .set({
        ...question,
        defaultName: question.defaultName !== undefined ? (question.defaultName ?? null) : undefined,
        defaultCategory: question.defaultCategory !== undefined ? (question.defaultCategory ?? null) : undefined,
        defaultStartTime: question.defaultStartTime !== undefined ? (question.defaultStartTime ?? null) : undefined,
        defaultEndTime: question.defaultEndTime !== undefined ? (question.defaultEndTime ?? null) : undefined,
        defaultColor: question.defaultColor !== undefined ? (question.defaultColor ?? null) : undefined,
        defaultNotes: question.defaultNotes !== undefined ? (question.defaultNotes ?? null) : undefined
      })
      .where(eq(timelineQuestions.id, id))
      .returning();

    return updatedQuestion;
  }
  
  async createTimelineQuestion(question: InsertTimelineQuestion): Promise<TimelineQuestion> {
    const [newQuestion] = await db
      .insert(timelineQuestions)
      .values({
        ...question,
        description: question.description ?? null,
        defaultName: question.defaultName ?? null,
        defaultCategory: question.defaultCategory ?? null,
        defaultStartTime: question.defaultStartTime ?? null,
        defaultEndTime: question.defaultEndTime ?? null,
        defaultColor: question.defaultColor ?? null,
        defaultNotes: question.defaultNotes ?? null
      })
      .returning();

    return newQuestion;
  }
  
  async deleteTimelineQuestion(id: number): Promise<boolean> {
    const result = await db
      .delete(timelineQuestions)
      .where(eq(timelineQuestions.id, id))
      .returning();

    return result.length > 0;
  }
  
  async updateTimelineQuestions(questions: TimelineQuestion[]): Promise<void> {
    // First, get the current questions to compare
    const currentQuestions = await this.getTimelineQuestions();
    
    // Update or insert each question
    for (const question of questions) {
      const existingQuestion = currentQuestions.find(q => q.id === question.id);
      if (existingQuestion) {
        await db.update(timelineQuestions)
          .set({
            question: question.question,
            description: question.description,
            order: question.order
          })
          .where(eq(timelineQuestions.id, question.id));
      } else {
        await db.insert(timelineQuestions).values({
          id: question.id,
          question: question.question,
          description: question.description,
          order: question.order
        });
      }
    }

    // Delete questions that are no longer in the list
    const questionIds = questions.map(q => q.id);
    await db.delete(timelineQuestions)
      .where(not(inArray(timelineQuestions.id, questionIds)));

    // Update the app settings to track the last update
    await this.updateAppSetting(
      'timeline_questions_last_update',
      new Date().toISOString(),
      'Last update timestamp for timeline questions',
      'system'
    );
  }
  
  // User Question Response methods
  async getUserQuestionResponses(userId: number, timelineId: number): Promise<UserQuestionResponse[]> {
    return db
      .select()
      .from(userQuestionResponses)
      .where(
        and(
          eq(userQuestionResponses.userId, userId),
          eq(userQuestionResponses.timelineId, timelineId)
        )
      );
  }
  
  async createUserQuestionResponse(response: InsertUserQuestionResponse): Promise<UserQuestionResponse> {
    const [newResponse] = await db
      .insert(userQuestionResponses)
      .values(response)
      .returning();
    return newResponse;
  }
  
  async updateUserQuestionResponse(id: number, response: Partial<InsertUserQuestionResponse>): Promise<UserQuestionResponse | undefined> {
    const [updatedResponse] = await db
      .update(userQuestionResponses)
      .set({
        ...response,
        updatedAt: new Date()
      })
      .where(eq(userQuestionResponses.id, id))
      .returning();
    return updatedResponse;
  }
  
  // Timeline Template methods
  async getTimelineTemplates(): Promise<TimelineTemplate[]> {
    return db
      .select()
      .from(timelineTemplates)
      .orderBy(timelineTemplates.name);
  }
  
  async getTimelineTemplate(id: number): Promise<TimelineTemplate | undefined> {
    const [template] = await db
      .select()
      .from(timelineTemplates)
      .where(eq(timelineTemplates.id, id));
    return template;
  }
  
  async createTimelineTemplate(template: InsertTimelineTemplate): Promise<TimelineTemplate> {
    // If this template is set as default, unset any previously default template
    if (template.isDefault) {
      await db
        .update(timelineTemplates)
        .set({ isDefault: false })
        .where(eq(timelineTemplates.isDefault, true));
    }
    
    const [newTemplate] = await db
      .insert(timelineTemplates)
      .values({
        ...template,
        description: template.description ?? null,
      })
      .returning();
    return newTemplate;
  }
  
  async updateTimelineTemplate(id: number, template: Partial<InsertTimelineTemplate>): Promise<TimelineTemplate | undefined> {
    // If this template is being set as default, unset any previously default template
    if (template.isDefault) {
      await db
        .update(timelineTemplates)
        .set({ isDefault: false })
        .where(eq(timelineTemplates.isDefault, true));
    }
    
    const [updatedTemplate] = await db
      .update(timelineTemplates)
      .set({
        ...template,
        description: template.description !== undefined ? (template.description ?? null) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(timelineTemplates.id, id))
      .returning();
    return updatedTemplate;
  }
  
  async deleteTimelineTemplate(id: number): Promise<boolean> {
    // First delete all associated template events
    await db
      .delete(templateEvents)
      .where(eq(templateEvents.templateId, id));
      
    // Then delete the template
    await db
      .delete(timelineTemplates)
      .where(eq(timelineTemplates.id, id));
    return true;
  }
  
  // Template Event methods
  async getTemplateEvents(templateId: number): Promise<TemplateEvent[]> {
    return db
      .select()
      .from(templateEvents)
      .where(eq(templateEvents.templateId, templateId))
      .orderBy(templateEvents.position);
  }
  
  async getTemplateEvent(id: number): Promise<TemplateEvent | undefined> {
    const [event] = await db
      .select()
      .from(templateEvents)
      .where(eq(templateEvents.id, id));
    return event;
  }
  
  async createTemplateEvent(event: InsertTemplateEvent): Promise<TemplateEvent> {
    const [templateEvent] = await db
      .insert(templateEvents)
      .values({
        ...event,
        notes: event.notes ?? null,
      })
      .returning();
    return templateEvent;
  }
  
  async updateTemplateEvent(id: number, event: Partial<InsertTemplateEvent>): Promise<TemplateEvent | undefined> {
    const [updatedEvent] = await db
      .update(templateEvents)
      .set({
        ...event,
        notes: event.notes !== undefined ? (event.notes ?? null) : undefined,
      })
      .where(eq(templateEvents.id, id))
      .returning();
    return updatedEvent;
  }
  
  async deleteTemplateEvent(id: number): Promise<boolean> {
    await db
      .delete(templateEvents)
      .where(eq(templateEvents.id, id));
    return true;
  }
  
  // Password Reset methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values(token)
      .returning();
    return resetToken;
  }
  
  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }
  
  async invalidatePasswordResetToken(token: string): Promise<boolean> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
    return true;
  }
  
  // Email Template methods
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return db
      .select()
      .from(emailTemplates)
      .orderBy(emailTemplates.name);
  }
  
  async getEmailTemplatesByType(type: string): Promise<EmailTemplate[]> {
    return db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.type, type))
      .orderBy(emailTemplates.name);
  }
  
  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return template;
  }
  
  async getDefaultEmailTemplate(type: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(
        and(
          eq(emailTemplates.type, type),
          eq(emailTemplates.isDefault, true)
        )
      );
    return template;
  }
  
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    // If this is set as default, we need to ensure no other template of this type is default
    if (template.isDefault) {
      await db
        .update(emailTemplates)
        .set({ isDefault: false })
        .where(eq(emailTemplates.type, template.type));
    }
    
    const [newTemplate] = await db
      .insert(emailTemplates)
      .values({
        ...template,
        updatedAt: new Date(),
      })
      .returning();
    return newTemplate;
  }
  
  async updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const [existingTemplate] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
      
    if (!existingTemplate) {
      return undefined;
    }
    
    // If this is being set as default, we need to ensure no other template of this type is default
    if (template.isDefault) {
      await db
        .update(emailTemplates)
        .set({ isDefault: false })
        .where(
          and(
            eq(emailTemplates.type, template.type || existingTemplate.type),
            ne(emailTemplates.id, id)
          )
        );
    }
    
    const [updatedTemplate] = await db
      .update(emailTemplates)
      .set({
        ...template,
        updatedAt: new Date(),
      })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updatedTemplate;
  }
  
  async deleteEmailTemplate(id: number): Promise<boolean> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
      
    // Don't allow deleting the default template
    if (template && template.isDefault) {
      throw new Error("Cannot delete the default template");
    }
    
    await db
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return true;
  }
  
  // App Settings methods
  async getAppSettings(category?: string): Promise<AppSetting[]> {
    const query = db.select().from(appSettings);
    
    if (category) {
      return query.where(eq(appSettings.category, category));
    }
    
    return query;
  }
  
  async getAppSetting(key: string): Promise<AppSetting | null> {
    const result = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return result[0] || null;
  }
  
  async setAppSetting(key: string, value: unknown, description: string, category: string): Promise<AppSetting> {
    const result = await db.insert(appSettings)
      .values({
        key,
        value,
        description,
        category,
      })
      .returning();
    return result[0];
  }
  
  async updateAppSetting(key: string, value: unknown, description: string, category: string): Promise<AppSetting> {
    const result = await db.update(appSettings)
      .set({
        value,
        description,
        category,
        updatedAt: new Date(),
      })
      .where(eq(appSettings.key, key))
      .returning();
    return result[0];
  }
  
  async deleteAppSetting(key: string): Promise<void> {
    await db.delete(appSettings).where(eq(appSettings.key, key));
  }

  // Last Selected Timeline methods
  async updateUserLastSelectedTimeline(userId: number, timelineId: number): Promise<void> {
    await pool.query(
      'UPDATE users SET last_selected_timeline_id = $1 WHERE id = $2',
      [timelineId, userId]
    );
  }

  async getUserLastSelectedTimeline(userId: number): Promise<number | null> {
    const result = await pool.query(
      'SELECT last_selected_timeline_id FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0]?.last_selected_timeline_id || null;
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
        email: "demo@example.com",
        name: "Demo User",
        isAdmin: false,
      });
      
      // Create admin user
      await storage.createUser({
        username: "admin",
        password: "admin123",
        email: "admin@example.com",
        name: "Admin User",
        isAdmin: true,
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
      
      // Add default timeline questions
      const defaultQuestions: InsertTimelineQuestion[] = [
        {
          question: "Will you have a hair and makeup session?",
          description: "Beauty preparations for the bride and bridal party",
          active: true,
          order: 1,
          defaultName: "Hair & Makeup",
          defaultCategory: "preparation",
          defaultStartTime: "08:00",
          defaultEndTime: "10:00",
          defaultColor: "bg-pink-100",
          defaultNotes: "For bride and bridesmaids",
          promptName: false,
          promptCategory: false,
          promptStartTime: true,
          promptEndTime: true,
          promptColor: false,
          promptNotes: true,
        },
        {
          question: "Will there be a first look before the ceremony?",
          description: "A private moment when the couple sees each other before the ceremony",
          active: true,
          order: 2,
          defaultName: "First Look",
          defaultCategory: "photos",
          defaultStartTime: "11:00",
          defaultEndTime: "11:30",
          defaultColor: "bg-purple-100",
          defaultNotes: "Private moment for the couple",
          promptName: false,
          promptCategory: false,
          promptStartTime: true,
          promptEndTime: true,
          promptColor: false,
          promptNotes: false,
        },
        {
          question: "Do you need transport to the ceremony venue?",
          description: "Travel arrangements from preparation location to ceremony venue",
          active: true,
          order: 3,
          defaultName: "Travel to Ceremony",
          defaultCategory: "travel",
          defaultStartTime: "11:30",
          defaultEndTime: "12:00",
          defaultColor: "bg-blue-100",
          defaultNotes: "",
          promptName: false,
          promptCategory: false,
          promptStartTime: true,
          promptEndTime: true,
          promptColor: false,
          promptNotes: true,
        },
        {
          question: "Will you have a receiving line after the ceremony?",
          description: "Greeting guests formally after the ceremony",
          active: true,
          order: 4,
          defaultName: "Receiving Line",
          defaultCategory: "custom",
          defaultStartTime: "13:30",
          defaultEndTime: "14:00",
          defaultColor: "bg-yellow-100",
          defaultNotes: "",
          promptName: false,
          promptCategory: false,
          promptStartTime: true,
          promptEndTime: true,
          promptColor: false,
          promptNotes: false,
        },
        {
          question: "Will you have formal family photos?",
          description: "Scheduled time for formal family and wedding party portraits",
          active: true,
          order: 5,
          defaultName: "Family Photos",
          defaultCategory: "photos",
          defaultStartTime: "14:00",
          defaultEndTime: "15:00",
          defaultColor: "bg-green-100",
          defaultNotes: "Family, bridal party and couple portraits",
          promptName: false,
          promptCategory: false,
          promptStartTime: true,
          promptEndTime: true,
          promptColor: false,
          promptNotes: true,
        },
      ];

      for (const question of defaultQuestions) {
        await storage.createTimelineQuestion(question);
      }
      
      console.log('Default data initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
}

// Call initialization (will only create data if it doesn't exist)
initializeDefaultData();
