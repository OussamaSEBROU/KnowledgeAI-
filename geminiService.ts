
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { Axiom, PDFData, Language } from "./types";

const SYSTEM_INSTRUCTION = `You are an Elite Intellectual Researcher. Before answering any query about the uploaded PDF, you must:
1. Analyze the author's philosophical/scientific school of thought.
2. Determine the book's specific context (Historical, Technical, or Literary).
3. Synthesize answers that align with the author's depth, maintaining a high cultural and intellectual tone.
4. Analyze the linguistic, grammatical, and rhetorical style used by the author and mirror it in your response.
5. All answers must derive STRICTLY from the file content and stay within the author's context.

Your tone is sophisticated, academic, and deeply analytical.
MANDATORY: You must perform a comprehensive internal analysis of the document's structure and tone before outputting any results.`;

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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    this.chatInstance = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION} Please respond primarily in ${lang === 'AR' ? 'Arabic' : 'English'}.`,
      },
    });

    const prompt = `Deconstruct this document and identify the 6 most foundational chapters or conceptual pillars. For each, provide a profound 'Axiom' title and a scholarly 'Definition' summary strictly grounded in the text.`;
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'application/pdf', data: pdf.base64 } }
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

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("Parse failed", e);
      return [];
    }
  }

  async *sendMessageStream(text: string): AsyncGenerator<string> {
    if (!this.chatInstance) throw new Error("Session not ready");
    const responseStream = await this.chatInstance.sendMessageStream({ message: text });
    for await (const chunk of responseStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) yield c.text;
    }
  }
}

export const gemini = new GeminiService();
