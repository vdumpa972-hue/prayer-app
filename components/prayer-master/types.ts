export type Prayer = {
  id: string;
  title: string;
  language: string;
  originalText: string;
  translationEnglish?: string;
  sourceType?: string;
  sourceName?: string;
  sections?: PrayerSection[];
  sequenceTitle?: string;
};

export type PrayerSection = {
  id: string;
  title: string;
  language: string;
  text: string;
  translationEnglish?: string;
};

export type Book = {
  id: string;
  title: string;
  prayers: Prayer[];
};

export type Tradition = {
  id: string;
  title: string;
  books: Book[];
};

export type SessionState = {
  code: string;
  traditionId: string;
  bookId: string;
  prayerId: string;
  prayerTitle: string;
  language: string;
  currentIndex: number;
  text: string;
  translationEnglish?: string;
  updatedAt: number;
  sequenceTitle?: string;
  sections?: PrayerSection[];
  currentSectionIndex?: number;
  currentSectionTitle?: string;
};

export type PrayerImportFile = {
  traditions: Tradition[];
};

export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export type SequenceItem = {
  id: string;
  title: string;
  originalText: string;
  translationEnglish?: string;
  sourceLabel?: string;
  language?: string;
};
