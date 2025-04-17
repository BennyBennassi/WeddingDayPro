import { pool } from "./db";

async function runMigrations() {
  console.log("Running database migrations...");
  
  try {
    // Check if users table exists
    const usersTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    const usersTableExists = usersTableResult.rows[0].exists;
    
    if (usersTableExists) {
      // Add new columns to users table if they don't exist
      await addColumnIfNotExists('users', 'email', 'TEXT');
      await addColumnIfNotExists('users', 'name', 'TEXT');
      await addColumnIfNotExists('users', 'is_admin', 'BOOLEAN', 'FALSE');
      await addColumnIfNotExists('users', 'created_at', 'TIMESTAMP', 'NOW()');
      
      console.log("User table migrations completed successfully");
    } else {
      console.log("Users table does not exist, no migrations needed");
    }
    
    // Create admin user if not exists
    await createAdminUserIfNotExists();
    
    // Create timeline questions table if not exists
    await createTimelineQuestionsTable();
    
    // Create user question responses table if not exists
    await createUserQuestionResponsesTable();
    
    // Create sample timeline questions if needed
    await createSampleTimelineQuestions();

    // Update existing timeline questions to set all prompt fields to false
    await updateExistingQuestionsPromptFields();

  } catch (error) {
    console.error("Error running migrations:", error);
  }
}

async function addColumnIfNotExists(table: string, column: string, type: string, defaultValue?: string) {
  try {
    // Check if column exists
    const columnResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      );
    `, [table, column]);
    
    const columnExists = columnResult.rows[0].exists;
    
    if (!columnExists) {
      // Add column with default value if specified
      const defaultClause = defaultValue ? ` DEFAULT ${defaultValue}` : '';
      await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}${defaultClause};`);
      console.log(`Added column ${column} to ${table} table`);
    } else {
      console.log(`Column ${column} already exists in ${table} table`);
    }
  } catch (error) {
    console.error(`Error adding column ${column} to ${table}:`, error);
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
    // Check if admin user exists
    const adminResult = await pool.query(`
      SELECT * FROM users WHERE username = 'admin';
    `);
    
    if (adminResult.rows.length === 0) {
      // Admin user does not exist, create it
      const hashedPassword = await hashPassword('admin123');
      
      await pool.query(`
        INSERT INTO users (username, password, email, name, is_admin) 
        VALUES ('admin', $1, 'admin@example.com', 'Admin User', TRUE);
      `, [hashedPassword]);
      
      console.log("Created admin user");
    } else {
      // Update existing user to be an admin if not already
      if (!adminResult.rows[0].is_admin) {
        await pool.query(`
          UPDATE users SET is_admin = TRUE WHERE username = 'admin';
        `);
        console.log("Updated admin user privileges");
      } else {
        console.log("Admin user already exists");
      }
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
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
      // Update existing questions to set all prompt fields to false
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
      
      console.log("Updated existing timeline questions to default prompt fields to FALSE");
    }
  } catch (error) {
    console.error("Error updating existing timeline questions:", error);
  }
}

export default runMigrations;