import { pool } from "./db";

export async function runMigrations() {
  console.log("Running database migrations...");
  
  try {
    // Create users table if not exists
    const usersTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    const usersTableExists = usersTableResult.rows[0].exists;
    
    if (!usersTableExists) {
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          is_admin BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          last_selected_timeline_id INTEGER
        );
      `);
      console.log("Created users table");
    } else {
      // Add new columns to users table if they don't exist
      await addColumnIfNotExists('users', 'email', 'TEXT');
      await addColumnIfNotExists('users', 'name', 'TEXT');
      await addColumnIfNotExists('users', 'is_admin', 'BOOLEAN', 'FALSE');
      await addColumnIfNotExists('users', 'created_at', 'TIMESTAMP', 'NOW()');
      await addColumnIfNotExists('users', 'last_selected_timeline_id', 'INTEGER');
      
      console.log("User table migrations completed successfully");
    }

    // Create wedding_timelines table if not exists
    const weddingTimelinesTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'wedding_timelines'
      );
    `);
    
    const weddingTimelinesTableExists = weddingTimelinesTableResult.rows[0].exists;
    
    if (!weddingTimelinesTableExists) {
      await pool.query(`
        CREATE TABLE wedding_timelines (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          title TEXT NOT NULL,
          wedding_date DATE,
          wedding_couple TEXT,
          start_hour INTEGER NOT NULL DEFAULT 0,
          end_hour INTEGER NOT NULL DEFAULT 24,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log("Created wedding_timelines table");
    }

    // Create venue_restrictions table if not exists
    const venueRestrictionsTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'venue_restrictions'
      );
    `);
    
    const venueRestrictionsTableExists = venueRestrictionsTableResult.rows[0].exists;
    
    if (!venueRestrictionsTableExists) {
      await pool.query(`
        CREATE TABLE venue_restrictions (
          id SERIAL PRIMARY KEY,
          timeline_id INTEGER NOT NULL REFERENCES wedding_timelines(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log("Created venue_restrictions table");
    }

    // Create share_tokens table if not exists
    const shareTokensTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'share_tokens'
      );
    `);
    
    const shareTokensTableExists = shareTokensTableResult.rows[0].exists;
    
    if (!shareTokensTableExists) {
      await pool.query(`
        CREATE TABLE share_tokens (
          id SERIAL PRIMARY KEY,
          timeline_id INTEGER NOT NULL REFERENCES wedding_timelines(id),
          token TEXT NOT NULL UNIQUE,
          created_by INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMP NOT NULL
        );
      `);
      console.log("Created share_tokens table");
    }

    // Create timeline_events table if not exists
    const timelineEventsTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'timeline_events'
      );
    `);
    
    const timelineEventsTableExists = timelineEventsTableResult.rows[0].exists;
    
    if (!timelineEventsTableExists) {
      await pool.query(`
        CREATE TABLE timeline_events (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          timeline_id INTEGER REFERENCES wedding_timelines(id) ON DELETE CASCADE,
          category TEXT,
          color TEXT,
          notes TEXT,
          position INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log("Created timeline_events table");
    } else {
      // Add timeline_id column to timeline_events if it doesn't exist
      await addColumnIfNotExists('timeline_events', 'timeline_id', 'INTEGER');
    }
    
    // Create admin user if not exists
    await createAdminUserIfNotExists();
    
    // Create timeline questions table if not exists
    await createTimelineQuestionsTable();
    
    // Create user question responses table if not exists
    await createUserQuestionResponsesTable();
    
    // Create timeline templates table if not exists
    await createTimelineTemplatesTable();
    
    // Create template events table if not exists
    await createTemplateEventsTable();
    
    // Create sample timeline questions if needed
    await createSampleTimelineQuestions();
    
    // Create sample timeline templates if needed
    await createSampleTimelineTemplates();

    // Update existing timeline questions to set all prompt fields to false
    await updateExistingQuestionsPromptFields();
    
    // Create password reset tokens table if not exists
    await createPasswordResetTokensTable();
    
    // Create email templates table and default templates if not exists
    await createEmailTemplatesTable();
    await createDefaultEmailTemplates();
    
    // Create app settings table for persistent configuration
    await createAppSettingsTable();
    
    // Update any existing settings with missing categories
    await updateAppSettingsCategories();
    
    // Initialize default app settings
    await initializeDefaultAppSettings();

  } catch (error) {
    console.error("Error running migrations:", error);
  }
}

async function addColumnIfNotExists(table: string, column: string, type: string, defaultValue?: string) {
  try {
    const columnExistsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      );
    `, [table, column]);
    
    const columnExists = columnExistsResult.rows[0].exists;
    
    if (!columnExists) {
      let query = `ALTER TABLE ${table} ADD COLUMN ${column} ${type}`;
      if (defaultValue) {
        query += ` DEFAULT ${defaultValue}`;
      }
      await pool.query(query);
      console.log(`Added column ${column} to ${table} table`);
    }
  } catch (error) {
    console.error(`Error adding column ${column} to ${table} table:`, error);
  }
}

async function hashPassword(password: string): Promise<string> {
  // Import crypto functions
  const { scrypt, randomBytes } = await import('crypto');
  const { promisify } = await import('util');
  
  const scryptAsync = promisify(scrypt);
  
  // Hash password
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUserIfNotExists() {
  try {
    // Check if any admin user exists
    const adminResult = await pool.query(`
      SELECT * FROM users WHERE is_admin = TRUE LIMIT 1;
    `);
    
    if (adminResult.rows.length === 0) {
      // No admin users exist, create one
      const hashedPassword = await hashPassword('admin123');
      
      await pool.query(`
        INSERT INTO users (username, password, email, name, is_admin) 
        VALUES ('admin', $1, 'admin@example.com', 'Admin User', TRUE);
      `, [hashedPassword]);
      
      console.log("Created admin user");
    } else {
      console.log("At least one admin user already exists");
    }
  } catch (error) {
    console.error("Error checking for admin users:", error);
  }
}

async function createTimelineQuestionsTable() {
  try {
    // Check if table exists
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'timeline_questions'
      );
    `);
    
    const tableExists = tableResult.rows[0].exists;
    
    if (!tableExists) {
      // Create table
      await pool.query(`
        CREATE TABLE timeline_questions (
          id SERIAL PRIMARY KEY,
          question TEXT NOT NULL,
          description TEXT,
          active BOOLEAN NOT NULL DEFAULT true,
          "order" INTEGER NOT NULL DEFAULT 0,
          default_name TEXT,
          default_category TEXT,
          default_start_time TEXT,
          default_end_time TEXT,
          default_color TEXT,
          default_notes TEXT,
          prompt_name BOOLEAN NOT NULL DEFAULT true,
          prompt_category BOOLEAN NOT NULL DEFAULT false,
          prompt_start_time BOOLEAN NOT NULL DEFAULT true,
          prompt_end_time BOOLEAN NOT NULL DEFAULT true,
          prompt_color BOOLEAN NOT NULL DEFAULT false,
          prompt_notes BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log("Created timeline_questions table");
    } else {
      console.log("timeline_questions table already exists");
    }
  } catch (error) {
    console.error("Error creating timeline_questions table:", error);
  }
}

async function createUserQuestionResponsesTable() {
  try {
    // Check if table exists
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_question_responses'
      );
    `);
    
    const tableExists = tableResult.rows[0].exists;
    
    if (!tableExists) {
      // Create table
      await pool.query(`
        CREATE TABLE user_question_responses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          timeline_id INTEGER NOT NULL REFERENCES wedding_timelines(id) ON DELETE CASCADE,
          question_id INTEGER NOT NULL REFERENCES timeline_questions(id) ON DELETE CASCADE,
          answer BOOLEAN NOT NULL,
          completed BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          UNIQUE(user_id, timeline_id, question_id)
        );
      `);
      console.log("Created user_question_responses table");
    } else {
      console.log("user_question_responses table already exists");
    }
  } catch (error) {
    console.error("Error creating user_question_responses table:", error);
  }
}

async function createSampleTimelineQuestions() {
  try {
    // Check if we have any questions already
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM timeline_questions;
    `);
    
    const count = parseInt(countResult.rows[0].count);
    
    if (count === 0) {
      // Add sample questions
      await pool.query(`
        INSERT INTO timeline_questions 
          (question, description, active, "order", default_name, default_category, default_start_time, default_end_time, default_color, prompt_name, prompt_category, prompt_start_time, prompt_end_time, prompt_color, prompt_notes)
        VALUES
          ('Will you have hair and makeup professionals?', 'Professional hair and makeup usually takes 30-45 minutes per person', true, 10, 'Hair & Makeup', 'Getting Ready', '10:00', '12:00', '#f472b6', false, false, false, false, false, false),
          
          ('Are you having a first look?', 'A first look is a private moment for the couple to see each other before the ceremony', true, 20, 'First Look', 'Pre-Ceremony', '13:30', '14:00', '#a78bfa', false, false, false, false, false, false),
          
          ('Will you have a cocktail hour?', 'Typically happens between ceremony and reception while photos are being taken', true, 30, 'Cocktail Hour', 'Reception', '17:00', '18:00', '#60a5fa', false, false, false, false, false, false),
          
          ('Are you planning to have toasts/speeches?', 'Usually takes place during reception dinner', true, 40, 'Toasts & Speeches', 'Reception', '19:00', '19:30', '#34d399', false, false, false, false, false, false),
          
          ('Will you have a cake cutting?', 'Traditional part of the reception', true, 50, 'Cake Cutting', 'Reception', '20:00', '20:15', '#fbbf24', false, false, false, false, false, false),
          
          ('Are you planning a first dance?', 'Traditionally the first activity after dinner', true, 60, 'First Dance', 'Reception', '19:45', '19:55', '#f87171', false, false, false, false, false, false),
          
          ('Will there be parent dances?', 'Usually follows the first dance', true, 70, 'Parent Dances', 'Reception', '19:55', '20:10', '#fb923c', false, false, false, false, false, false);
      `);
      
      console.log("Created sample timeline questions");
    } else {
      console.log("Sample timeline questions not needed, records already exist");
    }
  } catch (error) {
    console.error("Error creating sample timeline questions:", error);
  }
}

async function updateExistingQuestionsPromptFields() {
  try {
    // Check if timeline_questions table exists
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'timeline_questions'
      );
    `);
    
    const tableExists = tableResult.rows[0].exists;
    
    if (tableExists) {
      // Check if we've already run this migration (we'll only do it for new installations)
      const promptInitialized = await pool.query(`
        SELECT COUNT(*) as count FROM timeline_questions;
      `);
      
      // Only apply this update for first-time installations, not on redeployments
      // This preserves admin settings between deployments
      if (promptInitialized.rows[0].count === 0) {
        // Update only for new installations
        await pool.query(`
          UPDATE timeline_questions 
          SET 
            prompt_name = false,
            prompt_category = false,
            prompt_start_time = false,
            prompt_end_time = false,
            prompt_color = false,
            prompt_notes = false;
        `);
        
        console.log("New installation: initialized timeline questions prompt fields to FALSE");
      } else {
        // IMPORTANT: For existing installations, we DO NOT reset prompt fields
        // First, check if we need to create a backup (only if it doesn't exist)
        const backupTableExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'timeline_questions_backup'
          );
        `);
        
        if (!backupTableExists.rows[0].exists) {
          // Create a backup table to store current settings
          await pool.query(`
            CREATE TABLE timeline_questions_backup AS
            SELECT id, prompt_name, prompt_category, prompt_start_time, 
                   prompt_end_time, prompt_color, prompt_notes
            FROM timeline_questions;
          `);
          console.log("Created backup of timeline questions prompt settings");
        } else {
          // Restore from backup if it exists
          const backupCount = await pool.query(`
            SELECT COUNT(*) as count FROM timeline_questions_backup;
          `);
          
          if (parseInt(backupCount.rows[0].count) > 0) {
            // We have backup data - restore it
            await pool.query(`
              UPDATE timeline_questions t
              SET 
                prompt_name = b.prompt_name,
                prompt_category = b.prompt_category,
                prompt_start_time = b.prompt_start_time,
                prompt_end_time = b.prompt_end_time,
                prompt_color = b.prompt_color,
                prompt_notes = b.prompt_notes
              FROM timeline_questions_backup b
              WHERE t.id = b.id;
            `);
            console.log("Restored timeline questions prompt settings from backup");
          }
        }
        
        console.log("Existing installation: preserving timeline questions prompt field settings");
      }
    }
  } catch (error) {
    console.error("Error handling timeline questions:", error);
  }
}

async function createTimelineTemplatesTable() {
  try {
    // Check if table exists
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'timeline_templates'
      );
    `);
    
    const tableExists = tableResult.rows[0].exists;
    
    if (!tableExists) {
      // Create table
      await pool.query(`
        CREATE TABLE timeline_templates (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          is_default BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log("Created timeline_templates table");
    } else {
      console.log("timeline_templates table already exists");
    }
  } catch (error) {
    console.error("Error creating timeline_templates table:", error);
  }
}

async function createTemplateEventsTable() {
  try {
    // Check if table exists
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'template_events'
      );
    `);
    
    const tableExists = tableResult.rows[0].exists;
    
    if (!tableExists) {
      // Create table
      await pool.query(`
        CREATE TABLE template_events (
          id SERIAL PRIMARY KEY,
          template_id INTEGER NOT NULL REFERENCES timeline_templates(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          category TEXT NOT NULL,
          color TEXT NOT NULL,
          notes TEXT,
          position INTEGER NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log("Created template_events table");
    } else {
      console.log("template_events table already exists");
    }
  } catch (error) {
    console.error("Error creating template_events table:", error);
  }
}

async function createSampleTimelineTemplates() {
  try {
    // Check if we have any templates already
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM timeline_templates;
    `);
    
    const count = parseInt(countResult.rows[0].count);
    
    if (count === 0) {
      // Add sample templates
      const churchTemplate = await pool.query(`
        INSERT INTO timeline_templates (name, description, is_default) 
        VALUES ('Church Wedding', 'Traditional wedding with church ceremony and separate reception venue', true)
        RETURNING id;
      `);
      
      const singleVenueTemplate = await pool.query(`
        INSERT INTO timeline_templates (name, description, is_default) 
        VALUES ('Single Venue', 'Wedding where both ceremony and reception are at the same venue', false)
        RETURNING id;
      `);
      
      const morningTemplate = await pool.query(`
        INSERT INTO timeline_templates (name, description, is_default) 
        VALUES ('Morning Ceremony', 'Early ceremony with daytime reception', false)
        RETURNING id;
      `);
      
      const eveningTemplate = await pool.query(`
        INSERT INTO timeline_templates (name, description, is_default) 
        VALUES ('Evening Ceremony', 'Late afternoon or evening ceremony with evening reception', false)
        RETURNING id;
      `);
      
      // Add events for Church Wedding template
      const churchTemplateId = churchTemplate.rows[0].id;
      await pool.query(`
        INSERT INTO template_events 
          (template_id, name, start_time, end_time, category, color, notes, position)
        VALUES
          ($1, 'Hair & Makeup', '08:00', '12:00', 'morning_prep', 'bg-pink-100', NULL, 1),
          ($1, 'Travel to Church', '12:15', '12:30', 'travel', 'bg-blue-100', NULL, 2),
          ($1, 'Church Ceremony', '13:00', '14:00', 'ceremony', 'bg-primary-light', NULL, 3),
          ($1, 'Photos at Church', '14:00', '14:30', 'photos', 'bg-green-100', NULL, 4),
          ($1, 'Travel to Reception', '14:30', '15:00', 'travel', 'bg-blue-100', NULL, 5),
          ($1, 'Drinks Reception', '15:30', '17:00', 'drinks_reception', 'bg-yellow-100', NULL, 6),
          ($1, 'Bell Call', '17:00', '17:30', 'bell_call', 'bg-orange-100', NULL, 7),
          ($1, 'Dinner Service', '17:30', '19:30', 'dining', 'bg-red-100', NULL, 8),
          ($1, 'Speeches', '19:30', '20:00', 'speeches', 'bg-accent-light', NULL, 9),
          ($1, 'Band', '21:00', '23:30', 'entertainment', 'bg-indigo-100', NULL, 10),
          ($1, 'DJ', '23:30', '01:30', 'dancing', 'bg-indigo-100', NULL, 11);
      `, [churchTemplateId]);
      
      // Add events for Single Venue template
      const singleVenueTemplateId = singleVenueTemplate.rows[0].id;
      await pool.query(`
        INSERT INTO template_events 
          (template_id, name, start_time, end_time, category, color, notes, position)
        VALUES
          ($1, 'Hair & Makeup', '10:00', '13:00', 'morning_prep', 'bg-pink-100', NULL, 1),
          ($1, 'Ceremony', '14:00', '15:00', 'ceremony', 'bg-primary-light', NULL, 2),
          ($1, 'Drinks Reception', '15:00', '17:00', 'drinks_reception', 'bg-yellow-100', NULL, 3),
          ($1, 'Photos', '15:15', '16:30', 'photos', 'bg-green-100', NULL, 4),
          ($1, 'Bell Call', '17:00', '17:30', 'bell_call', 'bg-orange-100', NULL, 5),
          ($1, 'Dinner Service', '17:30', '19:30', 'dining', 'bg-red-100', NULL, 6),
          ($1, 'Speeches', '19:30', '20:15', 'speeches', 'bg-accent-light', NULL, 7),
          ($1, 'Band Setup', '20:15', '21:00', 'entertainment', 'bg-gray-200', NULL, 8),
          ($1, 'First Dance', '21:00', '21:15', 'dancing', 'bg-purple-100', NULL, 9),
          ($1, 'Band', '21:15', '23:45', 'entertainment', 'bg-indigo-100', NULL, 10),
          ($1, 'DJ', '23:45', '01:30', 'dancing', 'bg-indigo-100', NULL, 11);
      `, [singleVenueTemplateId]);
      
      // Add events for Morning Ceremony template
      const morningTemplateId = morningTemplate.rows[0].id;
      await pool.query(`
        INSERT INTO template_events 
          (template_id, name, start_time, end_time, category, color, notes, position)
        VALUES
          ($1, 'Hair & Makeup', '05:00', '08:00', 'morning_prep', 'bg-pink-100', NULL, 1),
          ($1, 'Ceremony', '09:00', '10:00', 'ceremony', 'bg-primary-light', NULL, 2),
          ($1, 'Photos', '10:00', '11:30', 'photos', 'bg-green-100', NULL, 3),
          ($1, 'Brunch', '11:30', '13:30', 'dining', 'bg-red-100', NULL, 4),
          ($1, 'Afternoon Activities', '13:30', '16:00', 'entertainment', 'bg-yellow-100', NULL, 5),
          ($1, 'Bell Call', '17:00', '17:30', 'bell_call', 'bg-orange-100', NULL, 6),
          ($1, 'Dinner Service', '17:30', '19:30', 'dining', 'bg-red-100', NULL, 7),
          ($1, 'Evening Entertainment', '20:00', '00:00', 'dancing', 'bg-indigo-100', NULL, 8);
      `, [morningTemplateId]);
      
      // Add events for Evening Ceremony template
      const eveningTemplateId = eveningTemplate.rows[0].id;
      await pool.query(`
        INSERT INTO template_events 
          (template_id, name, start_time, end_time, category, color, notes, position)
        VALUES
          ($1, 'Hair & Makeup', '13:00', '16:00', 'morning_prep', 'bg-pink-100', NULL, 1),
          ($1, 'Ceremony', '17:00', '18:00', 'ceremony', 'bg-primary-light', NULL, 2),
          ($1, 'Drinks Reception', '18:00', '19:00', 'drinks_reception', 'bg-yellow-100', NULL, 3),
          ($1, 'Photos', '18:15', '19:00', 'photos', 'bg-green-100', NULL, 4),
          ($1, 'Dinner Service', '19:00', '21:00', 'dining', 'bg-red-100', NULL, 5),
          ($1, 'Speeches', '21:00', '21:30', 'speeches', 'bg-accent-light', NULL, 6),
          ($1, 'Dancing', '21:30', '01:30', 'dancing', 'bg-indigo-100', NULL, 7),
          ($1, 'Late Night Snacks', '23:00', '23:30', 'dining', 'bg-orange-100', NULL, 8);
      `, [eveningTemplateId]);
      
      console.log("Created sample timeline templates and events");
    } else {
      console.log("Sample timeline templates not needed, records already exist");
    }
  } catch (error) {
    console.error("Error creating sample timeline templates:", error);
  }
}

async function createPasswordResetTokensTable() {
  try {
    // Check if table exists
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'password_reset_tokens'
      );
    `);
    
    const tableExists = tableResult.rows[0].exists;
    
    if (!tableExists) {
      // Create table
      await pool.query(`
        CREATE TABLE password_reset_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          used BOOLEAN NOT NULL DEFAULT FALSE
        );
      `);
      console.log("Created password_reset_tokens table");
    } else {
      console.log("password_reset_tokens table already exists");
    }
  } catch (error) {
    console.error("Error creating password_reset_tokens table:", error);
  }
}

async function createEmailTemplatesTable() {
  try {
    // Check if table exists
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'email_templates'
      );
    `);
    
    const tableExists = tableResult.rows[0].exists;
    
    if (!tableExists) {
      // Create table
      await pool.query(`
        CREATE TABLE email_templates (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          subject TEXT NOT NULL,
          html_body TEXT NOT NULL,
          text_body TEXT NOT NULL, 
          is_default BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log("Created email_templates table");
    } else {
      console.log("email_templates table already exists");
    }
  } catch (error) {
    console.error("Error creating email_templates table:", error);
  }
}

async function createDefaultEmailTemplates() {
  try {
    // Check if we already have a password reset template
    const templateResult = await pool.query(`
      SELECT * FROM email_templates 
      WHERE type = 'password_reset' AND is_default = TRUE
      LIMIT 1;
    `);
    
    if (templateResult.rows.length === 0) {
      // No password reset template exists, create one
      const defaultHtmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; }
    .button { display: inline-block; background-color: #4a6ee0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Reset Your Password</h2>
    </div>
    <div class="content">
      <p>Hello {{username}},</p>
      <p>We received a request to reset your password for your Wedding Timeline Planner account. To reset your password, please click on the button below:</p>
      <p style="text-align: center;">
        <a href="{{resetLink}}" class="button">Reset Password</a>
      </p>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply.</p>
      <p>Wedding Timeline Planner</p>
    </div>
  </div>
</body>
</html>
      `;
      
      const defaultTextTemplate = `
Reset Your Password

Hello {{username}},

We received a request to reset your password for your Wedding Timeline Planner account.
To reset your password, please visit the following link:

{{resetLink}}

This link will expire in 1 hour for security reasons.

If you didn't request this, please ignore this email and your password will remain unchanged.

This is an automated message, please do not reply.
Wedding Timeline Planner
      `;
      
      await pool.query(`
        INSERT INTO email_templates (
          name, type, subject, html_body, text_body, is_default
        ) VALUES (
          'Default Password Reset', 'password_reset', 'Reset Your Password - Wedding Timeline Planner', 
          $1, $2, TRUE
        );
      `, [defaultHtmlTemplate, defaultTextTemplate]);
      
      console.log("Created default password reset email template");
    } else {
      console.log("Default password reset email template already exists");
    }
  } catch (error) {
    console.error("Error creating default email templates:", error);
  }
}

async function createAppSettingsTable() {
  try {
    // Check if table exists
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'app_settings'
      );
    `);
    
    const tableExists = tableResult.rows[0].exists;
    
    if (!tableExists) {
      // Create table
      await pool.query(`
        CREATE TABLE app_settings (
          id SERIAL PRIMARY KEY,
          key TEXT NOT NULL UNIQUE,
          value JSONB,
          description TEXT,
          category TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log("Created app_settings table");
    } else {
      console.log("app_settings table already exists");
    }
  } catch (error) {
    console.error("Error creating app_settings table:", error);
  }
}

async function updateAppSettingsCategories() {
  try {
    // Update any settings missing a category
    await pool.query(`
      UPDATE app_settings 
      SET category = CASE 
        WHEN key LIKE '%email%' THEN 'email'
        WHEN key LIKE '%timeline%' THEN 'timeline'
        WHEN key LIKE '%question%' THEN 'admin'
        ELSE 'system'
      END
      WHERE category IS NULL;
    `);
    console.log("Updated app settings categories");
  } catch (error) {
    console.error("Error updating app settings categories:", error);
  }
}

async function initializeDefaultAppSettings() {
  try {
    // Check if we have settings for timeline questions already
    const settingsResult = await pool.query(`
      SELECT * FROM app_settings WHERE key = 'timeline_questions_settings' LIMIT 1;
    `);
    
    if (settingsResult.rows.length === 0) {
      // Create timeline questions settings from current database state

      // First, check if we have timeline_questions_backup
      const backupTableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'timeline_questions_backup'
        );
      `);
      
      if (backupTableExists.rows[0].exists) {
        // Get backup data
        const backupResult = await pool.query(`
          SELECT * FROM timeline_questions_backup;
        `);
        
        if (backupResult.rows.length > 0) {
          // We have backup data, use it to create settings
          const settingsValue = {
            prompt_settings: backupResult.rows.map((row: any) => ({
              question_id: row.id,
              prompt_name: row.prompt_name,
              prompt_category: row.prompt_category,
              prompt_start_time: row.prompt_start_time,
              prompt_end_time: row.prompt_end_time,
              prompt_color: row.prompt_color,
              prompt_notes: row.prompt_notes
            })),
            last_updated: new Date().toISOString()
          };
          
          // Store settings in app_settings
          await pool.query(`
            INSERT INTO app_settings (key, value, description, category)
            VALUES ('timeline_questions_settings', $1, 'Timeline question prompt settings', 'admin');
          `, [JSON.stringify(settingsValue)]);
          
          console.log("Initialized timeline questions settings from backup");
        }
      } else {
        // No backup, get current live data
        const questionsResult = await pool.query(`
          SELECT * FROM timeline_questions;
        `);
        
        if (questionsResult.rows.length > 0) {
          // We have questions data, use it to create settings
          const settingsValue = {
            prompt_settings: questionsResult.rows.map((row: any) => ({
              question_id: row.id,
              prompt_name: row.prompt_name,
              prompt_category: row.prompt_category,
              prompt_start_time: row.prompt_start_time,
              prompt_end_time: row.prompt_end_time,
              prompt_color: row.prompt_color,
              prompt_notes: row.prompt_notes
            })),
            last_updated: new Date().toISOString()
          };
          
          // Store settings in app_settings
          await pool.query(`
            INSERT INTO app_settings (key, value, description, category)
            VALUES ('timeline_questions_settings', $1, 'Timeline question prompt settings', 'admin');
          `, [JSON.stringify(settingsValue)]);
          
          console.log("Initialized timeline questions settings from current data");
        }
      }
    } else {
      console.log("Timeline questions settings already exist in app_settings");
    }
    
    // Add general application settings
    const defaultSystemSettings = [
      {
        key: 'application_name',
        value: 'Wedding Timeline Planner',
        description: 'The name of the application shown in various places',
        category: 'system'
      },
      {
        key: 'application_version',
        value: '1.0.0',
        description: 'Current application version',
        category: 'system'
      },
      {
        key: 'default_timeline_name_format',
        value: 'TL{number} - {name}',
        description: 'The format for new timeline names',
        category: 'timeline'
      },
      {
        key: 'default_timeline_name',
        value: 'Default',
        description: 'The default name for the first timeline',
        category: 'timeline'
      },
      {
        key: 'minimum_timeline_length_minutes',
        value: 120,
        description: 'Minimum timeline length in minutes',
        category: 'timeline'
      },
      {
        key: 'company_name',
        value: 'Laura and Benny Photography',
        description: 'Company name used in emails and on the site',
        category: 'system'
      },
      {
        key: 'company_email',
        value: 'info@lauraandbennyphotography.eu',
        description: 'Company email for contact purposes',
        category: 'system'
      },
      {
        key: 'email_settings',
        value: {
          from_name: 'Laura and Benny Photography',
          reply_to: 'info@lauraandbennyphotography.eu',
          subject_prefix: '[Wedding Timeline] '
        },
        description: 'Default email settings',
        category: 'email'
      }
    ];
    
    // Check if each setting exists and add if it doesn't
    for (const setting of defaultSystemSettings) {
      try {
        const settingExists = await pool.query(`
          SELECT * FROM app_settings WHERE key = $1 LIMIT 1;
        `, [setting.key]);
        
        if (settingExists.rows.length === 0) {
          await pool.query(`
            INSERT INTO app_settings (key, value, description, category)
            VALUES ($1, $2::jsonb, $3, $4);
          `, [setting.key, JSON.stringify(setting.value), setting.description, setting.category]);
          
          console.log(`Added default app setting: ${setting.key}`);
        }
      } catch (settingError) {
        console.error(`Error adding default app setting ${setting.key}:`, settingError);
      }
    }
    
  } catch (error) {
    console.error("Error initializing default app settings:", error);
  }
}

export default runMigrations;