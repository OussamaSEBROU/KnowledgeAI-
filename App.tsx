
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { Axiom, PDFData, Language } from "./types";

const SYSTEM_INSTRUCTION = `You are a World-Class Senior Research Architect and Intellectual Analyst. 

MANDATORY RESPONSE PROTOCOL:
1. PRE-ANALYSIS: Before outputting any answer, you must internally deconstruct the provided document's structural philosophy and the author's specific delivery method.
2. STYLISTIC MIRRORING: Your responses must mirror the linguistic complexity and professional context of the source file.
3. STRICT GROUNDING: You are FORBIDDEN from providing information that exists outside the provided text. Every claim must be an axiomatic derivation of the uploaded content.
4. THINKING PHASE: Analyze the author's tone—whether technical, poetic, or analytical—and maintain that specific context.

Your goal is to provide an intellectual brainstorming extension of the author's mind.`;

// Using gemini-2.5-flash for high-performance, low-latency document deconstruction.
const MODEL_NAME = 'gemini-2.5-flash';

export class GeminiService {
  private chatInstance: Chat | null = null;

  constructor() {}

  /**
   * Initializes a new GoogleGenAI instance using the environment's API key directly.
   */
  private getAI() {
    // API key is obtained exclusively from process.env.API_KEY
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  resetService() {
    this.chatInstance = null;
  }

  async initializeSession(pdf: PDFData, lang: Language): Promise<Axiom[]> {
    const ai = this.getAI();
    
    const prompt = `Perform a deep intellectual deconstruction of this document. Identify the 6 foundational conceptual pillars (Axioms). Provide a title and a sophisticated summary for each. Output strictly as a JSON array of objects with "axiom" and "definition" properties.`;
    
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
      if (!text) throw new Error("The sanctuary deconstruction returned an empty result.");
      
      // Robust JSON parsing to handle potential markdown wrappers
      const cleanedJson = text.replace(/```json|```/gi, '').trim();
      const axioms = JSON.parse(cleanedJson);

      // Initialize persistent chat session
      this.chatInstance = ai.chats.create({
        model: MODEL_NAME,
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION} You are analyzing the document "${pdf.name}". Communicate strictly in ${lang === 'AR' ? 'Arabic' : 'English'}.`,
        },
        history: [
          {
            role: 'user',
            parts: [
              { text: "Synchronize with this document and prepare for deep inquiry." },
              { inlineData: { mimeType: 'application/pdf', data: pdf.base64 } }
            ]
          },
          {
            role: 'model',
            parts: [{ text: "Synchronization complete. Axiomatic core established. Stylistic mirroring active. Ready for inquiry." }]
          }
        ]
      });

      return axioms;
    } catch (e: any) {
      console.error("Gemini API Error:", e);
      throw new Error(e.message || "Synchronization failed.");
    }
  }

  async *sendMessageStream(text: string): AsyncGenerator<string> {
    if (!this.chatInstance) throw new Error("Sanctuary Session Not Initialized");
    
    const stream = await this.chatInstance.sendMessageStream({ 
      message: `[Intellectual Analysis Phase Activated] User Inquiry: ${text}.` 
    });

    for await (const chunk of stream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) yield c.text;
    }
  }
}

export const gemini = new GeminiService();
