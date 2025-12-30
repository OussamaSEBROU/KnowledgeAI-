
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { Axiom, PDFData, Language } from "./types";

const SYSTEM_INSTRUCTION = `You are a World-Class Senior Research Architect and Intellectual Analyst. 

MANDATORY RESPONSE PROTOCOL:
1. PRE-ANALYSIS: Before outputting any answer, you must internally deconstruct the provided document's structural philosophy and the author's specific delivery method.
2. STYLISTIC MIRRORING: Your responses must mirror the linguistic complexity and professional context of the source file.
3. STRICT GROUNDING: You are FORBIDDEN from providing information that exists outside the provided text. Every claim must be an axiomatic derivation of the uploaded content.
4. THINKING PHASE: Analyze the author's tone—whether technical, poetic, or analytical—and maintain that specific context.

Your goal is to provide an intellectual brainstorming extension of the author's mind.`;

// Using gemini-3-pro-preview for complex reasoning and document deconstruction.
const MODEL_NAME = 'gemini-2.5-flash';

export class GeminiService {
  private chatInstance: Chat | null = null;

  constructor() {}

  // Creates a new GoogleGenAI instance right before making an API call to ensure it uses the most up-to-date API key.
  private getAI() {
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
    
    // First, extract the Axioms for the UI
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

      // Extract generated text from the response object's .text property.
      const text = response.text;
      if (!text) throw new Error("Empty response from model.");
      
      const axioms = JSON.parse(text.trim());

      // Initialize the Chat session with the PDF in the history for context persistence.
      this.chatInstance = ai.chats.create({
        model: MODEL_NAME,
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION} You are currently analyzing the document "${pdf.name}". You must communicate strictly in ${lang === 'AR' ? 'Arabic' : 'English'}.`,
        },
        history: [
          {
            role: 'user',
            parts: [
              { text: "This is the research document. Analyze its logic deeply." },
              { inlineData: { mimeType: 'application/pdf', data: pdf.base64 } }
            ]
          },
          {
            role: 'model',
            parts: [{ text: "The sanctuary is synchronized. I have ingested the document and extracted its axiomatic core. I am ready for your inquiry." }]
          }
        ]
      });

      return axioms;
    } catch (e: any) {
      console.error("Gemini API Error:", e);
      throw new Error(e.message || "Connection failed.");
    }
  }

  async *sendMessageStream(text: string): AsyncGenerator<string> {
    if (!this.chatInstance) throw new Error("Sanctuary Session Not Initialized");
    
    const stream = await this.chatInstance.sendMessageStream({ 
      message: `[Intellectual Analysis Phase Required] User Inquiry: ${text}.` 
    });

    for await (const chunk of stream) {
      const c = chunk as GenerateContentResponse;
      // Extract generated text from the stream chunk's .text property.
      if (c.text) yield c.text;
    }
  }
}

export const gemini = new GeminiService();
