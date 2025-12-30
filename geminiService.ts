import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { Axiom, PDFData, Language } from "./types";

const SYSTEM_INSTRUCTION = `You are a World-Class Senior Research Architect and Intellectual Analyst.

MANDATORY RESPONSE PROTOCOL:
1. PRE-ANALYSIS: Before outputting any answer, you must internally deconstruct the provided document's structural, stylistic, and conceptual DNA.
2. STYLISTIC MIRRORING: Your responses must mirror the linguistic complexity and professional context of the source material.
3. STRICT GROUNDING: You are FORBIDDEN from providing information that exists outside the provided text. Every claim must be traceable.
4. THINKING PHASE: Analyze the author's tone—whether technical, poetic, or analytical—and maintain that specific energy.

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
}
