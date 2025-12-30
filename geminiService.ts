
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { Axiom, PDFData, Language } from "./types";

const SYSTEM_INSTRUCTION = `You are a World-Class Senior Research Architect and Intellectual Analyst. 

MANDATORY RESPONSE PROTOCOL:
1. PRE-ANALYSIS: Before outputting any answer, you must internally deconstruct the provided document's structural philosophy and the author's specific delivery method.
2. STYLISTIC MIRRORING: Your responses must mirror the linguistic complexity and professional context of the source file.
3. STRICT GROUNDING: You are FORBIDDEN from providing information that exists outside the provided text. Every claim must be an axiomatic derivation of the uploaded content.
4. THINKING PHASE: Analyze the author's tone—whether technical, poetic, or analytical—and maintain that specific context.

Your goal is to provide an intellectual brainstorming extension of the author's mind.`;

// Using gemini-2.5-flash for high-performance, low-latency document deconstruction and sophisticated reasoning.
const MODEL_NAME = 'gemini-2.5-flash';

export class GeminiService {
  private chatInstance: Chat | null = null;

  constructor() {}

  /**
   * Initializes a new GoogleGenAI instance.
   * Created right before making an API call to ensure it always uses the most up-to-date API key.
   */
  private getAI() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable is missing. Please ensure your sanctuary is correctly configured.");
    }
    return new GoogleGenAI({ apiKey });
  }

  resetService() {
    this.chatInstance = null;
  }

  async initializeSession(pdf: PDFData, lang: Language): Promise<Axiom[]> {
    const ai = this.getAI();
    
    // Step 1: Extract the foundational Axioms for the research interface
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
                axiom: { type: Type.STRING, description: "The title of the core principle or pillar." },
                definition: { type: Type.STRING, description: "A sophisticated, grounded summary of the axiom." }
              },
              required: ['axiom', 'definition']
            }
          }
        }
      });

      // Directly accessing the .text property of the response
      const text = response.text;
      if (!text) throw new Error("The sanctuary deconstruction returned an empty result.");
      
      const axioms = JSON.parse(text.trim());

      // Step 2: Initialize the persistent Chat session with the document embedded in history
      this.chatInstance = ai.chats.create({
        model: MODEL_NAME,
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION} You are analyzing the document "${pdf.name}". You must communicate strictly in ${lang === 'AR' ? 'Arabic' : 'English'}.`,
        },
        history: [
          {
            role: 'user',
            parts: [
              { text: "This is the research document. Synchronize with its logic and prepare for deep inquiry." },
              { inlineData: { mimeType: 'application/pdf', data: pdf.base64 } }
            ]
          },
          {
            role: 'model',
            parts: [{ text: "The sanctuary is synchronized. I have ingested the document's axiomatic core and established stylistic mirroring. I am ready to facilitate your investigation." }]
          }
        ]
      });

      return axioms;
    } catch (e: any) {
      console.error("Gemini API Error during synchronization:", e);
      throw new Error(e.message || "The sanctuary link was unstable. Check your API key and file size.");
    }
  }

  async *sendMessageStream(text: string): AsyncGenerator<string> {
    if (!this.chatInstance) throw new Error("Sanctuary Session Not Initialized");
    
    const stream = await this.chatInstance.sendMessageStream({ 
      message: `[Analytical Phase Activated] User Inquiry: ${text}.` 
    });

    for await (const chunk of stream) {
      const c = chunk as GenerateContentResponse;
      // Extract generated text from the stream chunk directly via the .text property
      if (c.text) yield c.text;
    }
  }
}

export const gemini = new GeminiService();
