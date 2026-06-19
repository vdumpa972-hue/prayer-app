import { Book, Prayer, PrayerImportFile, SessionState, Tradition } from './types';

export function splitWords(text: string) {
  return text.split(/\s+/).map((w) => w.trim()).filter(Boolean);
}

export function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function slugify(value: string) {
  return (value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'item');
}

export function normalizeImport(data: PrayerImportFile): Tradition[] {
  const traditions = Array.isArray(data?.traditions) ? data.traditions : [];
  return traditions.map((tradition, traditionIndex) => ({
    id: tradition.id || `${slugify(tradition.title || 'tradition')}_${traditionIndex}`,
    title: tradition.title || `Tradition ${traditionIndex + 1}`,
    books: (tradition.books || []).map((book, bookIndex) => ({
      id: book.id || `${slugify(book.title || 'book')}_${bookIndex}`,
      title: book.title || `Book ${bookIndex + 1}`,
      prayers: (book.prayers || []).map((prayer, prayerIndex) => ({
        id: prayer.id || `${slugify(prayer.title || 'prayer')}_${prayerIndex}`,
        title: prayer.title || `Prayer ${prayerIndex + 1}`,
        language: prayer.language || 'en',
        originalText: prayer.originalText || '',
        translationEnglish: prayer.translationEnglish || '',
        sourceType: prayer.sourceType || 'json_import',
        sourceName: prayer.sourceName || 'Imported Library',
        sections: prayer.sections,
        sequenceTitle: prayer.sequenceTitle,
      })),
    })),
  }));
}

export function traditionsArrayToDbObject(traditions: Tradition[]) {
  return Object.fromEntries(
    traditions.map((tradition) => [
      tradition.id,
      {
        id: tradition.id,
        title: tradition.title,
        books: Object.fromEntries(
          tradition.books.map((book) => [
            book.id,
            {
              id: book.id,
              title: book.title,
              prayers: Object.fromEntries(book.prayers.map((prayer) => [prayer.id, { ...prayer }])),
            },
          ])
        ),
      },
    ])
  );
}

export function traditionsDbObjectToArray(value: any): Tradition[] {
  if (!value || typeof value !== 'object') return [];

  return Object.values(value)
    .map((tradition: any) => ({
      id: tradition.id || '',
      title: tradition.title || 'Untitled',
      books: tradition.books
        ? Object.values(tradition.books).map((book: any) => ({
            id: book.id || '',
            title: book.title || 'Untitled',
            prayers: book.prayers
              ? Object.values(book.prayers).map((prayer: any) => ({
                  id: prayer.id,
                  title: prayer.title || 'Untitled',
                  language: prayer.language || 'en',
                  originalText: prayer.originalText || '',
                  translationEnglish: prayer.translationEnglish || '',
                  sourceType: prayer.sourceType || '',
                  sourceName: prayer.sourceName || '',
                  sections: Array.isArray(prayer.sections) ? prayer.sections : undefined,
                  sequenceTitle: prayer.sequenceTitle || undefined,
                }))
              : [],
          }))
        : [],
    }))
    .filter((tradition: Tradition) => tradition.id && tradition.title);
}

export function findTradition(traditions: Tradition[], traditionId: string) {
  return traditions.find((t) => t.id === traditionId) ?? null;
}

export function findBook(traditions: Tradition[], traditionId: string, bookId: string) {
  return findTradition(traditions, traditionId)?.books.find((b) => b.id === bookId) ?? null;
}

export function findPrayer(traditions: Tradition[], traditionId: string, bookId: string, prayerId: string) {
  return findBook(traditions, traditionId, bookId)?.prayers.find((p) => p.id === prayerId) ?? null;
}

export function getFirstSelectable(traditions: Tradition[]) {
  const firstTradition = traditions[0] ?? null;
  const firstBook = firstTradition?.books[0] ?? null;
  const firstPrayer = firstBook?.prayers[0] ?? null;
  return {
    traditionId: firstTradition?.id ?? '',
    bookId: firstBook?.id ?? '',
    prayerId: firstPrayer?.id ?? '',
  };
}

export function cleanEntities(text: string) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&thinsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function stripHtmlAndArtifacts(text: string) {
  return cleanEntities(text)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{0\}/g, ' ')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function flattenAnyText(value: any): string {
  if (Array.isArray(value)) return value.map(flattenAnyText).join(' ').trim();
  if (typeof value === 'string') return stripHtmlAndArtifacts(value);
  return '';
}

export function mergeTraditions(existing: Tradition[], incoming: Tradition[]): Tradition[] {
  const traditionMap = new Map<string, Tradition>();

  for (const tradition of existing) {
    traditionMap.set(tradition.id, {
      ...tradition,
      books: tradition.books.map((b) => ({ ...b, prayers: [...b.prayers] })),
    });
  }

  for (const tradition of incoming) {
    const currentTradition = traditionMap.get(tradition.id);
    if (!currentTradition) {
      traditionMap.set(tradition.id, {
        ...tradition,
        books: tradition.books.map((b) => ({ ...b, prayers: [...b.prayers] })),
      });
      continue;
    }

    const bookMap = new Map<string, Book>();
    for (const b of currentTradition.books) bookMap.set(b.id, { ...b, prayers: [...b.prayers] });

    for (const incomingBook of tradition.books) {
      const currentBook = bookMap.get(incomingBook.id);
      if (!currentBook) {
        bookMap.set(incomingBook.id, { ...incomingBook, prayers: [...incomingBook.prayers] });
        continue;
      }

      const prayerMap = new Map<string, Prayer>();
      for (const p of currentBook.prayers) prayerMap.set(p.id, { ...p });
      for (const incomingPrayer of incomingBook.prayers) prayerMap.set(incomingPrayer.id, { ...incomingPrayer });

      bookMap.set(incomingBook.id, {
        ...currentBook,
        title: incomingBook.title || currentBook.title,
        prayers: Array.from(prayerMap.values()),
      });
    }

    traditionMap.set(tradition.id, {
      ...currentTradition,
      title: tradition.title || currentTradition.title,
      books: Array.from(bookMap.values()),
    });
  }

  return Array.from(traditionMap.values());
}

export function normalizeWordForMatch(word: string) {
  return word
    .toLowerCase()
    .replace(/[.,!?;:"'”“’()[\]{}<>|/\\\-_=+*&^%$#@~`]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

export function isCloseWordMatch(expected: string, heard: string) {
  if (!expected || !heard) return false;
  if (expected === heard) return true;
  if (Math.abs(expected.length - heard.length) > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;

  while (i < expected.length && j < heard.length) {
    if (expected[i] === heard[j]) {
      i += 1;
      j += 1;
      continue;
    }

    edits += 1;
    if (edits > 1) return false;

    if (expected.length > heard.length) {
      i += 1;
    } else if (heard.length > expected.length) {
      j += 1;
    } else {
      i += 1;
      j += 1;
    }
  }

  if (i < expected.length || j < heard.length) edits += 1;
  return edits <= 1;
}

export function speechLangForPrayer(prayer?: Prayer | null, session?: SessionState | null) {
  const sectionLang = session?.sections?.[session.currentSectionIndex ?? 0]?.language?.toLowerCase() || '';
  const lang = sectionLang || prayer?.language?.toLowerCase() || '';
  if (lang.startsWith('he')) return 'he-IL';
  if (lang.startsWith('ar')) return 'ar-SA';
  return 'en-US';
}
