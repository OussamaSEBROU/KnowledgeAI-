
export interface Axiom {
  axiom: string;
  definition: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface PDFData {
  base64: string;
  name: string;
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  ERROR = 'ERROR'
}

export type Language = 'EN' | 'AR';

export interface Translations {
  title: string;
  subtitle: string;
  subtitle2: string;
  readingDisclaimer: string;
  creator: string;
  uploadTitle: string;
  uploadSubtitle: string;
  uploadBtn: string;
  resetBtn: string;
  newSession: string;
  analyzing: string;
  transmitting: string;
  sidebarAbout: string;
  sidebarHelp: string;
  sidebarLanguage: string;
  sidebarResearch: string;
  sidebarViewPdf: string;
  dialogueTitle: string;
  axiomTitle: string;
  placeholder: string;
  helpContent: string;
  aboutContent: string;
  flashcardPillar: string;
  flashcardTouch: string;
  flashcardSummary: string;
  flashcardGrounding: string;
}
