import pkg from 'pg';  // Import the entire package as the default
const { Client } = pkg;  // Destructure Client from the imported package

// Initialize PostgreSQL connection
const client = new Client({
  connectionString: process.env.DATABASE_URL,  // Ensure your DATABASE_URL is correctly set in .env
});

client.connect();

// Function to get recent interactions from the database
export const getRecentInteractions = async () => {
  try {
    const result = await client.query("SELECT * FROM interactions ORDER BY timestamp DESC LIMIT 10");
    return result.rows;  // Return the most recent 10 interactions
  } catch (error) {
    console.error("❌ Error fetching recent interactions:", error.message);
    return [];  // Return an empty array in case of an error
  }
};

// Function to log interactions to the database
export const logInteraction = async ({ userId, action, details, timestamp }) => {
  try {
    const query = "INSERT INTO interactions (user_id, action, details, timestamp) VALUES ($1, $2, $3, $4)";
    await client.query(query, [userId, action, JSON.stringify(details), timestamp]);
  } catch (error) {
    console.error("❌ Error logging interaction:", error.message);
  }
};
