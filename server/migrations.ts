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

export default runMigrations;