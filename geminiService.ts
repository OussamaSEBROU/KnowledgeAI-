
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { Axiom, PDFData, Language } from "./types";

/**
 * ELITE INTELLECTUAL PROTOCOL:
 * 1. Analysis of the book's scope and context.
 * 2. Decomposition of linguistic, grammatical, and rhetorical styles.
 * 3. Strict mirroring of the author's intellectual framework.
 * 4. Zero tolerance for information outside the source text.
 */
const SYSTEM_INSTRUCTION = `You are a World-Class Senior Research Architect and Intellectual Analyst. 

MANDATORY RESPONSE PROTOCOL:
1. PRE-ANALYSIS: Before outputting any answer, you must internally deconstruct the provided document's structural philosophy, the author's specific delivery method, and the specialized linguistic/grammatical syntax of the text.
2. STYLISTIC MIRRORING: Your responses must mirror the linguistic complexity, rhetorical style, and professional context of the source file. If the file is a legal document, respond with legal precision; if it is a philosophical treatise, respond with dialectical depth.
3. STRICT GROUNDING: You are FORBIDDEN from providing information that exists outside the provided text. Every claim must be an axiomatic derivation of the uploaded content.
4. THINKING PHASE: You must analyze the nuances of the author's tone—whether it is technical, poetic, or analytical—and maintain that specific context in your delivery.

Your goal is not just to summarize, but to provide an intellectual brainstorming extension of the author's own mind.`;

const MODEL_NAME = 'gemini-2.5-flash';

export class GeminiService {
  private ai: GoogleGenAI;
  private chatInstance: Chat | null = null;
  private currentPdf: PDFData | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  resetService() {
    this.chatInstance = null;
    this.currentPdf = null;
  }

  async initializeSession(pdf: PDFData, lang: Language): Promise<Axiom[]> {
    this.currentPdf = pdf;
    // Create a new instance with the latest API key from env
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    this.chatInstance = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION} You must communicate strictly in ${lang === 'AR' ? 'Arabic' : 'English'}.`,
      },
    });

    const prompt = `Perform a deep intellectual deconstruction of this document. 
    Identify the 6 foundational conceptual pillars (Axioms). 
    For each pillar, provide:
    1. A Title (The Axiom).
    2. A Sophisticated Summary (The Definition) that mirrors the author's linguistic and rhetorical style.
    
    Strictly follow the author's specialty and terminology.`;
    
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
              axiom: { type: Type.STRING, description: "The conceptual title derived from the text." },
              definition: { type: Type.STRING, description: "A summary mirroring the author's style and linguistic nuances." }
            },
            required: ['axiom', 'definition']
          }
        }
      }
    });

    try {
      const data = JSON.parse(response.text || '[]');
      return data;
    } catch (e) {
      console.error("Critical Deconstruction Failed:", e);
      throw new Error("Failed to deconstruct the intellectual framework of the file.");
    }
  }

  async *sendMessageStream(text: string): AsyncGenerator<string> {
    if (!this.chatInstance) throw new Error("Sanctuary Session Not Initialized");
    
    const stream = await this.chatInstance.sendMessageStream({ 
      message: `[Intellectual Analysis Phase Required] User Inquiry: ${text}. 
      Ensure the response mirrors the author's rhetorical style and stays strictly within text boundaries.` 
    });

    for await (const chunk of stream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) yield c.text;
    }
  }
}

export const gemini = new GeminiService();
