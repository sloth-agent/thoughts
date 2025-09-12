import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const thoughts = pgTable("thoughts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  author: text("author").notNull().default("Anonymous Thinker"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  likes: integer("likes").default(0).notNull(),
  tags: text("tags").array().default([]).notNull(),
  connections: text("connections").array().default([]).notNull(),
});

export const insertThoughtSchema = createInsertSchema(thoughts).pick({
  content: true,
  author: true,
}).extend({
  content: z.string().min(1, "Content is required").max(280, "Content must be 280 characters or less"),
  author: z.string().optional(),
});

export type InsertThought = z.infer<typeof insertThoughtSchema>;
export type Thought = typeof thoughts.$inferSelect;

export interface ThoughtConnection {
  thoughtId: string;
  connectedThoughtId: string;
  reason: string;
  strength: number;
}

export interface NetworkStats {
  totalThoughts: number;
  activeConnections: number;
  userContributions: number;
}
