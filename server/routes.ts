import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertThoughtSchema } from "@shared/schema";
import { analyzeThought, findConnections } from "./services/gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all thoughts
  app.get("/api/thoughts", async (_req, res) => {
    try {
      const thoughts = await storage.getAllThoughts();
      res.json(thoughts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch thoughts" });
    }
  });

  // Create new thought
  app.post("/api/thoughts", async (req, res) => {
    try {
      console.log("📝 Creating new thought:", req.body);
      const validatedData = insertThoughtSchema.parse(req.body);
      
      // Create the thought
      const newThought = await storage.createThought(validatedData);
      console.log("✅ Thought created with ID:", newThought.id);
      
      // Get existing thoughts for connection analysis
      const existingThoughts = await storage.getAllThoughts();
      const otherThoughts = existingThoughts.filter(t => t.id !== newThought.id);
      console.log(`🔍 Found ${otherThoughts.length} existing thoughts to analyze for connections`);
      
      // Find connections using Gemini (run in background)
      if (otherThoughts.length > 0) {
        console.log("🚀 Starting background AI connection analysis...");
        findConnections(newThought, otherThoughts)
          .then(async (connections) => {
            console.log(`🔗 Processing ${connections.connectedThoughts.length} connections...`);
            
            // Update the new thought with connections
            const connectionIds = connections.connectedThoughts.map(c => c.id);
            await storage.updateThoughtConnections(newThought.id, connectionIds);
            console.log(`✅ Updated thought ${newThought.id} with connections:`, connectionIds);
            
            // Update connected thoughts to include bidirectional connections
            for (const conn of connections.connectedThoughts) {
              const connectedThought = await storage.getThought(conn.id);
              if (connectedThought) {
                const updatedConnections = [...connectedThought.connections, newThought.id];
                await storage.updateThoughtConnections(conn.id, updatedConnections);
                console.log(`✅ Updated bidirectional connection for thought ${conn.id}`);
              }
            }
            
            // Update thought with suggested tags
            const thoughtWithTags = await storage.getThought(newThought.id);
            if (thoughtWithTags && connections.suggestedTags.length > 0) {
              const updatedThought = { 
                ...thoughtWithTags, 
                tags: connections.suggestedTags.slice(0, 3) 
              };
              // Fix: Update tags properly in storage
              const currentThought = await storage.getThought(newThought.id);
              if (currentThought) {
                currentThought.tags = connections.suggestedTags.slice(0, 3);
                console.log(`✅ Updated thought ${newThought.id} with tags:`, currentThought.tags);
              }
            }
            
            console.log("🎉 AI connection processing completed successfully!");
          })
          .catch(error => {
            console.error("❌ Failed to process connections:", error);
          });
      } else {
        console.log("ℹ️ No existing thoughts to analyze for connections");
      }
      
      res.json(newThought);
    } catch (error: any) {
      console.error("❌ Error creating thought:", error);
      res.status(400).json({ message: error.message || "Invalid thought data" });
    }
  });

  // Search thoughts
  app.get("/api/thoughts/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        res.status(400).json({ message: "Search query is required" });
        return;
      }
      
      const results = await storage.searchThoughts(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Like a thought
  app.post("/api/thoughts/:id/like", async (req, res) => {
    try {
      const thoughtId = req.params.id;
      const updatedThought = await storage.likeThought(thoughtId);
      
      if (!updatedThought) {
        res.status(404).json({ message: "Thought not found" });
        return;
      }
      
      res.json(updatedThought);
    } catch (error) {
      res.status(500).json({ message: "Failed to like thought" });
    }
  });

  // Get connected thoughts
  app.get("/api/thoughts/:id/connections", async (req, res) => {
    try {
      const thoughtId = req.params.id;
      const connectedThoughts = await storage.getConnectedThoughts(thoughtId);
      res.json(connectedThoughts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get connections" });
    }
  });

  // Get network stats
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getNetworkStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
