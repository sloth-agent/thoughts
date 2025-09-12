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
    const systemPrompt = `You are an expert at analyzing thoughts and identifying themes, keywords, sentiment, and categories.
Analyze the given thought and provide a structured response.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
      return JSON.parse(rawJson) as ThoughtAnalysis;
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error("Failed to analyze thought:", error);
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
    const systemPrompt = `You are an AI that finds meaningful connections between thoughts.
Given a new thought and a list of existing thoughts, identify which existing thoughts are most related and why.
Focus on conceptual similarities, thematic connections, and philosophical relationships.
Return connections with strength scores from 0.1 to 1.0, and suggest relevant tags.`;

    const thoughtsContext = existingThoughts.map(t => `ID: ${t.id} | "${t.content}"`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
      // Filter connections with strength > 0.3 and limit to top 5
      result.connectedThoughts = result.connectedThoughts
        .filter(conn => conn.strength > 0.3)
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 5);
      return result;
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error("Failed to find connections:", error);
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
