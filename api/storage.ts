import { type Thought, type InsertThought, type ThoughtConnection, type NetworkStats } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const STORAGE_FILE = path.resolve(process.cwd(), "thoughts.json");

export interface IStorage {
  getThought(id: string): Promise<Thought | undefined>;
  getAllThoughts(): Promise<Thought[]>;
  createThought(thought: InsertThought): Promise<Thought>;
  searchThoughts(query: string): Promise<Thought[]>;
  likeThought(id: string): Promise<Thought | undefined>;
  updateThoughtConnections(id: string, connections: string[]): Promise<Thought | undefined>;
  getNetworkStats(): Promise<NetworkStats>;
  getConnectedThoughts(thoughtId: string): Promise<Thought[]>;
  getThoughtOfTheDay(): Promise<Thought | undefined>;
}

export class MemStorage implements IStorage {
  private thoughts: Map<string, Thought>;

  constructor() {
    this.thoughts = new Map();
    this.loadThoughts();
  }

  private async saveThoughts(): Promise<void> {
    await fs.writeFile(STORAGE_FILE, JSON.stringify(Array.from(this.thoughts.values()), null, 2));
  }

  private async loadThoughts(): Promise<void> {
    try {
      const data = await fs.readFile(STORAGE_FILE, "utf-8");
      const parsedThoughts: Thought[] = JSON.parse(data);
      this.thoughts = new Map(parsedThoughts.map(thought => [thought.id, thought]));
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.log("Storage file not found, initializing empty thoughts.");
        this.thoughts = new Map();
      } else {
        console.error("Error loading thoughts from file:", error);
        this.thoughts = new Map(); // Initialize empty on error
      }
    }
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
    await this.saveThoughts();
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
      await this.saveThoughts();
      return updatedThought;
    }
    return undefined;
  }

  async updateThoughtConnections(id: string, connections: string[]): Promise<Thought | undefined> {
    const thought = this.thoughts.get(id);
    if (thought) {
      const updatedThought = { ...thought, connections };
      this.thoughts.set(id, updatedThought);
      await this.saveThoughts();
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

  async getThoughtOfTheDay(): Promise<Thought | undefined> {
    const allThoughts = Array.from(this.thoughts.values());
    if (allThoughts.length === 0) {
      return undefined;
    }

    const date = new Date();
    const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    const randomIndex = Math.floor(seed % allThoughts.length);

    return allThoughts[randomIndex];
  }
}

export const storage = new MemStorage();
