import { z } from "zod";

export interface Thought {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  likes: number;
  tags: string[];
  connections: string[];
}

export const insertThoughtSchema = z.object({
  content: z.string().min(1, "Content is required").max(280, "Content must be 280 characters or less"),
  author: z.string().optional(),
});

export type InsertThought = z.infer<typeof insertThoughtSchema>;

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