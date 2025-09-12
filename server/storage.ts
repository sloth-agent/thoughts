import { type Thought, type InsertThought, type ThoughtConnection, type NetworkStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getThought(id: string): Promise<Thought | undefined>;
  getAllThoughts(): Promise<Thought[]>;
  createThought(thought: InsertThought): Promise<Thought>;
  searchThoughts(query: string): Promise<Thought[]>;
  likeThought(id: string): Promise<Thought | undefined>;
  updateThoughtConnections(id: string, connections: string[]): Promise<Thought | undefined>;
  getNetworkStats(): Promise<NetworkStats>;
  getConnectedThoughts(thoughtId: string): Promise<Thought[]>;
}

export class MemStorage implements IStorage {
  private thoughts: Map<string, Thought>;
  private connections: Map<string, ThoughtConnection[]>;

  constructor() {
    this.thoughts = new Map();
    this.connections = new Map();
  }

  async getThought(id: string): Promise<Thought | undefined> {
    return this.thoughts.get(id);
  }

  async getAllThoughts(): Promise<Thought[]> {
    return Array.from(this.thoughts.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createThought(insertThought: InsertThought): Promise<Thought> {
    const id = randomUUID();
    const thought: Thought = {
      ...insertThought,
      id,
      author: insertThought.author || "Anonymous Thinker",
      createdAt: new Date(),
      likes: 0,
      tags: [],
      connections: [],
    };
    this.thoughts.set(id, thought);
    return thought;
  }

  async searchThoughts(query: string): Promise<Thought[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.thoughts.values()).filter(
      (thought) =>
        thought.content.toLowerCase().includes(searchTerm) ||
        thought.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
  }

  async likeThought(id: string): Promise<Thought | undefined> {
    const thought = this.thoughts.get(id);
    if (thought) {
      const updatedThought = { ...thought, likes: thought.likes + 1 };
      this.thoughts.set(id, updatedThought);
      return updatedThought;
    }
    return undefined;
  }

  async updateThoughtConnections(id: string, connections: string[]): Promise<Thought | undefined> {
    const thought = this.thoughts.get(id);
    if (thought) {
      const updatedThought = { ...thought, connections };
      this.thoughts.set(id, updatedThought);
      return updatedThought;
    }
    return undefined;
  }

  async getNetworkStats(): Promise<NetworkStats> {
    const allThoughts = Array.from(this.thoughts.values());
    const totalConnections = allThoughts.reduce((sum, thought) => sum + thought.connections.length, 0);
    
    return {
      totalThoughts: allThoughts.length,
      activeConnections: totalConnections,
      userContributions: allThoughts.filter(t => t.author !== "Anonymous Thinker").length,
    };
  }

  async getConnectedThoughts(thoughtId: string): Promise<Thought[]> {
    const thought = this.thoughts.get(thoughtId);
    if (!thought) return [];
    
    return thought.connections
      .map(id => this.thoughts.get(id))
      .filter((t): t is Thought => t !== undefined);
  }
}

export const storage = new MemStorage();
