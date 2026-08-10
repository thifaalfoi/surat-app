import { query } from "@/lib/db";

export async function logActivity(userId: string, action: string, detail: string) {
  await query(
    `INSERT INTO activity_log (action, detail, user_id) VALUES ($1, $2, $3)`,
    [action, detail, userId]
  );
}
