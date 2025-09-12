import { GoogleGenAI } from "@google/genai";
import type { Thought } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ThoughtAnalysis {
  themes: string[];
  keywords: string[];
  sentiment: string;
  category: string;
}

interface ConnectionResult {
  connectedThoughts: Array<{
    id: string;
    reason: string;
    strength: number;
  }>;
  suggestedTags: string[];
}

export async function analyzeThought(thought: Thought): Promise<ThoughtAnalysis> {
  try {
    console.log("🧠 Starting thought analysis for:", thought.content.substring(0, 50) + "...");
    
    const systemPrompt = `You are an expert at analyzing thoughts and identifying themes, keywords, sentiment, and categories.
Analyze the given thought and provide a structured response.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            themes: {
              type: "array",
              items: { type: "string" }
            },
            keywords: {
              type: "array", 
              items: { type: "string" }
            },
            sentiment: { type: "string" },
            category: { type: "string" }
          },
          required: ["themes", "keywords", "sentiment", "category"]
        }
      },
      contents: `Analyze this thought: "${thought.content}"`
    });

    const rawJson = response.text;
    if (rawJson) {
      const result = JSON.parse(rawJson) as ThoughtAnalysis;
      console.log("✅ Thought analysis completed:", result);
      return result;
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error("❌ Failed to analyze thought:", error);
    return {
      themes: [],
      keywords: [],
      sentiment: "neutral",
      category: "general"
    };
  }
}

export async function findConnections(newThought: Thought, existingThoughts: Thought[]): Promise<ConnectionResult> {
  try {
    console.log(`🔗 Starting connection analysis for: "${newThought.content.substring(0, 50)}..." against ${existingThoughts.length} existing thoughts`);
    
    const systemPrompt = `You are an AI that finds meaningful connections between thoughts.
Given a new thought and a list of existing thoughts, identify which existing thoughts are most related and why.
Focus on conceptual similarities, thematic connections, shared keywords, and philosophical relationships.
Be generous with connections - even subtle thematic links are valuable.
Return connections with strength scores from 0.1 to 1.0, and suggest relevant tags.

Examples of connections to look for:
- Religious themes (god, faith, spirituality, jesus, allah, buddha, etc.)
- Emotional states (happiness, sadness, anxiety, love, etc.)
- Life concepts (death, birth, meaning, purpose, etc.)
- Social topics (politics, relationships, work, family, etc.)
- Abstract concepts (time, space, consciousness, existence, etc.)`;

    const thoughtsContext = existingThoughts.map(t => `ID: ${t.id} | "${t.content}"`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            connectedThoughts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  reason: { type: "string" },
                  strength: { type: "number" }
                },
                required: ["id", "reason", "strength"]
              }
            },
            suggestedTags: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["connectedThoughts", "suggestedTags"]
        }
      },
      contents: `New thought: "${newThought.content}"\n\nExisting thoughts:\n${thoughtsContext}`
    });

    const rawJson = response.text;
    if (rawJson) {
      const result = JSON.parse(rawJson) as ConnectionResult;
      console.log(`🔍 Raw connection results:`, result);
      
      // Filter connections with strength > 0.2 (lowered threshold) and limit to top 5
      result.connectedThoughts = result.connectedThoughts
        .filter(conn => conn.strength > 0.2)
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 5);
        
      console.log(`✅ Filtered connections (${result.connectedThoughts.length}):`, result.connectedThoughts);
      return result;
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error("❌ Failed to find connections:", error);
    return {
      connectedThoughts: [],
      suggestedTags: []
    };
  }
}

export async function generateThoughtSummary(thoughts: Thought[]): Promise<string> {
  try {
    const thoughtsText = thoughts.map(t => t.content).join(' | ');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide a brief, insightful summary of the main themes and ideas in these connected thoughts: ${thoughtsText}`
    });

    return response.text || "Connected thoughts exploring various perspectives and ideas.";
  } catch (error) {
    console.error("Failed to generate summary:", error);
    return "Connected thoughts exploring various perspectives and ideas.";
  }
}
