import postgres from "postgres";

export const sql = postgres(process.env.DATABASE_URL, {
  max: 5,
  idle_timeout: 20
});

export async function ensureUser(userId: string): Promise<void> {
  await sql`
    INSERT INTO app_user (id)
    VALUES (${userId}::uuid)
    ON CONFLICT (id) DO NOTHING
  `;
}
