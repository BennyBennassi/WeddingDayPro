import { pool } from "../db";

async function deleteDefaultAdminUser() {
  try {
    console.log("Attempting to delete default admin user...");
    
    // Check if admin user exists
    const result = await pool.query(`
      SELECT * FROM users WHERE username = 'admin';
    `);
    
    if (result.rows.length === 0) {
      console.log("Default admin user not found.");
      return;
    }
    
    // Delete the admin user
    await pool.query(`
      DELETE FROM users WHERE username = 'admin';
    `);
    
    console.log("Default admin user has been deleted successfully.");
  } catch (error) {
    console.error("Error deleting admin user:", error);
  } finally {
    await pool.end();
  }
}

// Execute the function
deleteDefaultAdminUser();