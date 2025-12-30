
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { Axiom, PDFData, Language } from "./types";

const SYSTEM_INSTRUCTION = `You are a World-Class Senior Research Architect and Intellectual Analyst. 

MANDATORY RESPONSE PROTOCOL:
1. PRE-ANALYSIS: Before outputting any answer, you must internally deconstruct the provided document's structural philosophy and the author's specific delivery method.
2. STYLISTIC MIRRORING: Your responses must mirror the linguistic complexity and professional context of the source file.
3. STRICT GROUNDING: You are FORBIDDEN from providing information that exists outside the provided text. Every claim must be an axiomatic derivation of the uploaded content.
4. THINKING PHASE: Analyze the author's tone—whether technical, poetic, or analytical—and maintain that specific context.

Your goal is to provide an intellectual brainstorming extension of the author's mind.`;

// Using gemini-3-flash-preview for high performance and better availability in most regions
const MODEL_NAME = 'gemini-3-flash-preview';

export class GeminiService {
  private chatInstance: Chat | null = null;

  constructor() {}

  private getAI() {
    // Note: process.env.API_KEY must be configured in your environment (e.g., Render dashboard)
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable is missing. Please configure it in your deployment settings.");
    }
    return new GoogleGenAI({ apiKey });
  }

  resetService() {
    this.chatInstance = null;
  }

  async initializeSession(pdf: PDFData, lang: Language): Promise<Axiom[]> {
    const ai = this.getAI();
    
    // Initialize the chat for future interactions
    this.chatInstance = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION} You must communicate strictly in ${lang === 'AR' ? 'Arabic' : 'English'}.`,
        thinkingConfig: { thinkingBudget: 0 } // Flash-preview handles fast deconstruction well without explicit budget
      },
    });

    const prompt = `Perform a deep intellectual deconstruction of this document. Identify the 6 foundational conceptual pillars (Axioms). Provide a title and a sophisticated summary for each. Output strictly as a JSON array of objects with "axiom" and "definition" properties. Do not include any markdown formatting like \`\`\`json.`;
    
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdf.base64
              }
            }
          ]
        },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                axiom: { type: Type.STRING },
                definition: { type: Type.STRING }
              },
              required: ['axiom', 'definition']
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from model. The PDF might be too large or the API key restricted.");
      
      // Attempting to clean potential markdown if the model ignores the instruction
      const cleanedJson = text.replace(/```json|```/gi, '').trim();
      return JSON.parse(cleanedJson);
    } catch (e: any) {
      console.error("Gemini API Error details:", e);
      throw new Error(e.message || "Failed to communicate with Gemini API. Check your API key permissions.");
    }
  }

  async *sendMessageStream(text: string): AsyncGenerator<string> {
    if (!this.chatInstance) throw new Error("Sanctuary Session Not Initialized");
    
    const stream = await this.chatInstance.sendMessageStream({ 
      message: `[Intellectual Analysis Phase Required] User Inquiry: ${text}.` 
    });

    for await (const chunk of stream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) yield c.text;
    }
  }
}

export const gemini = new GeminiService();
