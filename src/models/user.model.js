import pool from "../config/database.js";
import { v7 as uuidv7 } from "uuid";

export const upsertUser = async ({ github_id, username, email, avatar_url }) => {
  const [existing] = await pool.execute("SELECT * FROM users WHERE github_id = ?", [github_id]);
  
  if (existing.length > 0) {
    await pool.execute(
      "UPDATE users SET last_login_at = NOW(), username = ?, avatar_url = ? WHERE github_id = ?",
      [username, avatar_url, github_id]
    );
    return existing[0];
  }

  const id = uuidv7();
  const role = 'analyst'; // Default role
  await pool.execute(
    "INSERT INTO users (id, github_id, username, email, avatar_url, role) VALUES (?, ?, ?, ?, ?, ?)",
    [id, github_id, username, email, avatar_url, role]
  );
  
  const [user] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
  return user[0];
};

export const findById = async (id) => {
  const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
};