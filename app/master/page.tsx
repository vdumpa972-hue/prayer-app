'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { get, onValue, ref, set, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { getCurrentUserProfile, isTrialExpired, setPlanCookie, signOutUser, subscribeToAuth, AppUserProfile } from "@/lib/auth";
import { useLanguage } from "@/components/LanguageProvider";
import { getDisplayRole } from "@/lib/i18n";

type Prayer = {
  id: string;
  title: string;
  language: string;
  originalText: string;
  translationEnglish?: string;
  sourceType?: string;
  sourceName?: string;
  sections?: PrayerSection[];
  sequenceTitle?: string;
  category?: string;
  tags?: string[];
  notes?: string;
  sourceOrigin?: string;
  rawData?: any;
  [key: string]: any;
};

type PrayerSection = {
  id: string;
  title: string;
  language: string;
  text: string;
  translationEnglish?: string;
};

type Book = {
  id: string;
  title: string;
  prayers: Prayer[];
};

type Tradition = {
  id: string;
  title: string;
  books: Book[];
};

type SessionState = {
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

type PrayerImportFile = {
  traditions: Tradition[];
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type VoiceEngine = "browser" | "groq";


type SequenceItem = {
  id: string;
  title: string;
  originalText: string;
  translationEnglish?: string;
  sourceLabel?: string;
  language?: string;
};

const DEBUG_TRACE_STORAGE_KEY = "prayer_debug_trace_enabled";
const DEBUG_TRACE_CHANGED_EVENT = "prayer-debug-trace-changed";
const SAVED_RELIGION_STORAGE_KEY = "prayer_master_saved_religion";

type VoiceDebugState = {
  note: string;
  heardTokens: string;
  matchedWord: string;
  matchedAt: number;
  advancedTo: number;
  scannedFrom: number;
  transcriptUpdatedAt: string;
};

const SAMPLE_LIBRARY: Tradition[] = [
  {
    id: "jewish_prayer_books",
    title: "Jewish Prayer Books",
    books: [
      {
        id: "daily_morning",
        title: "Daily Morning Prayers",
        prayers: [
          {
            id: "modeh_ani",
            title: "Modeh Ani",
            language: "he",
            originalText:
              "מודה אני לפניך מלך חי וקיים שהחזרת בי נשמתי בחמלה רבה אמונתך",
            translationEnglish:
              "I thank You, living and enduring King, for returning my soul within me with compassion; abundant is Your faithfulness.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "asher_yatzar",
            title: "Asher Yatzar",
            language: "he",
            originalText:
              "ברוך אתה יהוה אלהינו מלך העולם אשר יצר את האדם בחכמה וברא בו נקבים נקבים חלולים חלולים",
            translationEnglish:
              "Blessed are You, Lord our God, King of the universe, who formed man with wisdom and created within him many openings and cavities.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "elohai_neshama",
            title: "Elohai Neshama",
            language: "he",
            originalText:
              "אלהי נשמה שנתת בי טהורה היא אתה בראתה אתה יצרתה אתה נפחתה בי ואתה משמרה בקרבי",
            translationEnglish:
              "My God, the soul which You placed within me is pure. You created it, You formed it, You breathed it into me, and You preserve it within me.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "shema",
            title: "Shema",
            language: "he",
            originalText:
              "שמע ישראל יהוה אלהינו יהוה אחד ברוך שם כבוד מלכותו לעולם ועד",
            translationEnglish:
              "Hear, O Israel: the Lord is our God, the Lord is One. Blessed be the name of His glorious kingdom forever and ever.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "v_ahavta",
            title: "VeAhavta",
            language: "he",
            originalText:
              "ואהבת את יהוה אלהיך בכל לבבך ובכל נפשך ובכל מאדך והיו הדברים האלה אשר אנכי מצוך היום על לבבך",
            translationEnglish:
              "And you shall love the Lord your God with all your heart, with all your soul, and with all your might.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "amidah_opening",
            title: "Amidah Opening",
            language: "he",
            originalText: "אדני שפתי תפתח ופי יגיד תהלתך",
            translationEnglish:
              "Lord, open my lips, and my mouth will declare Your praise.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
        ],
      },
      {
        id: "shabbat_prayers",
        title: "Shabbat Prayers",
        prayers: [
          {
            id: "shalom_aleichem",
            title: "Shalom Aleichem",
            language: "he",
            originalText:
              "שלום עליכם מלאכי השרת מלאכי עליון ממלך מלכי המלכים הקדוש ברוך הוא",
            translationEnglish:
              "Peace unto you, ministering angels, angels of the Most High.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "eshet_chayil_opening",
            title: "Eshet Chayil Opening",
            language: "he",
            originalText: "אשת חיל מי ימצא ורחק מפנינים מכרה",
            translationEnglish:
              "A woman of valor who can find? Her worth is far above pearls.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "kiddush",
            title: "Kiddush",
            language: "he",
            originalText:
              "יום הששי ויכלו השמים והארץ וכל צבאם ויכל אלהים ביום השביעי מלאכתו אשר עשה",
            translationEnglish:
              "And the heavens and the earth were finished, and all their array.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "hamavdil",
            title: "Havdalah Opening",
            language: "he",
            originalText:
              "המבדיל בין קדש לחל בין אור לחשך בין ישראל לעמים בין יום השביעי לששת ימי המעשה",
            translationEnglish:
              "Who separates between sacred and ordinary, between light and darkness.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
        ],
      },
      {
        id: "food_blessings",
        title: "Blessings and Meals",
        prayers: [
          {
            id: "hamotzi",
            title: "HaMotzi",
            language: "he",
            originalText:
              "ברוך אתה יהוה אלהינו מלך העולם המוציא לחם מן הארץ",
            translationEnglish:
              "Blessed are You, Lord our God, King of the universe, who brings forth bread from the earth.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "borei_pri_hagefen",
            title: "Borei Pri HaGafen",
            language: "he",
            originalText:
              "ברוך אתה יהוה אלהינו מלך העולם בורא פרי הגפן",
            translationEnglish:
              "Blessed are You, Lord our God, King of the universe, Creator of the fruit of the vine.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "birkat_hamazon_opening",
            title: "Birkat Hamazon Opening",
            language: "he",
            originalText:
              "ברוך אתה יהוה אלהינו מלך העולם הזן את העולם כולו בטובו בחן בחסד וברחמים",
            translationEnglish:
              "Blessed are You, Lord our God, King of the universe, who nourishes the whole world with goodness.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
        ],
      },
    ],
  },
  {
    id: "catholic_prayers",
    title: "Catholic Prayers",
    books: [
      {
        id: "basic_prayers",
        title: "Basic Prayers",
        prayers: [
          {
            id: "sign_of_the_cross",
            title: "Sign of the Cross",
            language: "en",
            originalText:
              "In the name of the Father and of the Son and of the Holy Spirit amen",
            translationEnglish: "Traditional opening Catholic invocation.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "our_father",
            title: "Our Father",
            language: "en",
            originalText:
              "Our Father who art in heaven hallowed be thy name thy kingdom come thy will be done on earth as it is in heaven",
            translationEnglish: "Traditional English prayer of the Lord's Prayer.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "hail_mary",
            title: "Hail Mary",
            language: "en",
            originalText:
              "Hail Mary full of grace the Lord is with thee blessed art thou among women and blessed is the fruit of thy womb Jesus",
            translationEnglish: "Traditional opening section of the Hail Mary prayer.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "glory_be",
            title: "Glory Be",
            language: "en",
            originalText:
              "Glory be to the Father and to the Son and to the Holy Spirit as it was in the beginning is now and ever shall be world without end amen",
            translationEnglish: "Traditional Christian doxology prayer.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
        ],
      },
      {
        id: "rosary_prayers",
        title: "Rosary Prayers",
        prayers: [
          {
            id: "apostles_creed",
            title: "Apostles' Creed",
            language: "en",
            originalText:
              "I believe in God the Father almighty Creator of heaven and earth and in Jesus Christ his only Son our Lord",
            translationEnglish: "Opening portion of the Apostles' Creed.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "fatima_prayer",
            title: "Fatima Prayer",
            language: "en",
            originalText:
              "O my Jesus forgive us our sins save us from the fires of hell lead all souls to heaven especially those most in need of thy mercy",
            translationEnglish: "Traditional Fatima Prayer.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
        ],
      },
    ],
  },
  {
    id: "christian_prayers",
    title: "Christian Prayers",
    books: [
      {
        id: "general_christian",
        title: "General Christian Prayers",
        prayers: [
          {
            id: "lords_prayer",
            title: "Lord's Prayer",
            language: "en",
            originalText:
              "Our Father in heaven hallowed be your name your kingdom come your will be done on earth as it is in heaven",
            translationEnglish: "Common Christian form of the Lord's Prayer.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "jesus_prayer",
            title: "Jesus Prayer",
            language: "en",
            originalText:
              "Lord Jesus Christ Son of God have mercy on me a sinner",
            translationEnglish: "Traditional short prayer in Eastern Christianity.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "prayer_of_jabez",
            title: "Prayer of Jabez",
            language: "en",
            originalText:
              "Oh that you would bless me and enlarge my territory let your hand be with me and keep me from harm",
            translationEnglish: "Short biblical prayer associated with 1 Chronicles 4:10.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
        ],
      },
      {
        id: "psalms_and_praise",
        title: "Psalms and Praise",
        prayers: [
          {
            id: "psalm_23_short",
            title: "Psalm 23 Short",
            language: "en",
            originalText:
              "The Lord is my shepherd I shall not want He makes me lie down in green pastures He leads me beside still waters",
            translationEnglish: "Opening section of Psalm 23.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "psalm_121_short",
            title: "Psalm 121 Short",
            language: "en",
            originalText:
              "I lift up my eyes to the hills from where does my help come My help comes from the Lord who made heaven and earth",
            translationEnglish: "Opening section of Psalm 121.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
        ],
      },
    ],
  },
  {
    id: "quran_seed",
    title: "Quran",
    books: [
      {
        id: "opening_and_short_surahs",
        title: "Opening and Short Surahs",
        prayers: [
          {
            id: "surah_al_fatiha",
            title: "Surah Al-Fatiha",
            language: "ar",
            originalText:
              "بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن الرحيم مالك يوم الدين إياك نعبد وإياك نستعين اهدنا الصراط المستقيم",
            translationEnglish:
              "In the name of Allah, the Entirely Merciful, the Especially Merciful. All praise is due to Allah, Lord of the worlds.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "surah_al_ikhlas",
            title: "Surah Al-Ikhlas",
            language: "ar",
            originalText:
              "قل هو الله أحد الله الصمد لم يلد ولم يولد ولم يكن له كفوا أحد",
            translationEnglish:
              "Say: He is Allah, One. Allah, the Eternal Refuge.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "surah_al_falaq",
            title: "Surah Al-Falaq",
            language: "ar",
            originalText:
              "قل أعوذ برب الفلق من شر ما خلق ومن شر غاسق إذا وقب",
            translationEnglish:
              "Say: I seek refuge in the Lord of daybreak.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
          {
            id: "surah_an_nas",
            title: "Surah An-Nas",
            language: "ar",
            originalText:
              "قل أعوذ برب الناس ملك الناس إله الناس من شر الوسواس الخناس",
            translationEnglish:
              "Say: I seek refuge in the Lord of mankind.",
            sourceType: "seed",
            sourceName: "Sample Library",
          },
        ],
      },
    ],
  },
];


function getReligionReadingBackground(traditionId?: string, title?: string, language?: string) {
  const key = `${traditionId ?? ""} ${title ?? ""} ${language ?? ""}`.toLowerCase();

  if (key.includes("islam") || key.includes("muslim") || key.includes("quran") || key.includes("sura") || key.includes("arabic")) {
    return "/religion-backgrounds/islam-reading-bg.jpg";
  }

  if (key.includes("jew") || key.includes("hebrew") || key.includes("torah") || key.includes("sefaria") || key.includes("tanakh")) {
    return "/religion-backgrounds/jewish-reading-bg.jpg";
  }

  return "/religion-backgrounds/christian-reading-bg.jpg";
}

function splitWords(text: string) {
  return text.split(/\s+/).map((w) => w.trim()).filter(Boolean);
}

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function slugify(value: string) {

  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "item"
  );
}

function normalizePrayerItem(prayer: any, prayerIndex: number, defaultSourceName: string, sourceOrigin = "json_import"): Prayer {
  const title = prayer?.title || prayer?.name || `Prayer ${prayerIndex + 1}`;
  const originalText =
    prayer?.originalText ||
    prayer?.text ||
    prayer?.body ||
    prayer?.content ||
    prayer?.englishText ||
    "";

  return {
    ...(prayer && typeof prayer === "object" ? prayer : {}),
    id: prayer?.id || `${slugify(title)}_${prayerIndex}`,
    title,
    language: prayer?.language || prayer?.lang || "en",
    originalText,
    translationEnglish: prayer?.translationEnglish || prayer?.translation || prayer?.english || "",
    sourceType: prayer?.sourceType || sourceOrigin,
    sourceName: prayer?.sourceName || defaultSourceName,
    sourceOrigin: prayer?.sourceOrigin || sourceOrigin,
    rawData: prayer?.rawData || prayer,
  };
}

function contentTypeLabel(prayer: Prayer) {
  const type = (prayer.sourceType || "").toLowerCase();
  if (type.includes("speech")) return "Speech";
  if (type.includes("sequence") || type.includes("sermon")) return "Sermon";
  return "Prayer";
}

function summarizeTraditions(traditions: Tradition[], originLabel: string) {
  const books = traditions.flatMap((tradition) =>
    tradition.books.map((book) => ({ traditionTitle: tradition.title, book }))
  );
  const items = books.flatMap(({ traditionTitle, book }) =>
    book.prayers.map((prayer) => ({ traditionTitle, bookTitle: book.title, prayer }))
  );
  const sampleNames = items.slice(0, 12).map((item) => `- [${contentTypeLabel(item.prayer)}] ${item.prayer.title} (${item.bookTitle} / ${item.traditionTitle})`);
  return [
    `Imported from: ${originLabel}`,
    `Books/libraries: ${books.length}`,
    `Items loaded: ${items.length}`,
    sampleNames.length ? `Loaded items:\n${sampleNames.join("\n")}` : "No item names available.",
  ].join("\n");
}

function sampleTraditionsForSelection(selectedTraditionId: string, selectedTraditionTitle?: string): Tradition[] {
  const key = `${selectedTraditionId} ${selectedTraditionTitle || ""}`.toLowerCase();
  if (!key.trim()) return [];
  if (key.includes("jew") || key.includes("hebrew") || key.includes("siddur") || key.includes("torah")) {
    return SAMPLE_LIBRARY.filter((tradition) => /jew|hebrew|siddur|torah/i.test(`${tradition.id} ${tradition.title}`));
  }
  if (key.includes("islam") || key.includes("muslim") || key.includes("quran") || key.includes("dua")) {
    return SAMPLE_LIBRARY.filter((tradition) => /quran|islam|muslim|dua/i.test(`${tradition.id} ${tradition.title}`));
  }
  if (key.includes("christ") || key.includes("catholic") || key.includes("orthodox") || key.includes("protestant") || key.includes("baptist") || key.includes("church")) {
    return SAMPLE_LIBRARY.filter((tradition) => /christ|catholic|orthodox|protestant|baptist|church/i.test(`${tradition.id} ${tradition.title}`));
  }
  return SAMPLE_LIBRARY.filter((tradition) => `${tradition.id} ${tradition.title}`.toLowerCase().includes(key.trim()));
}

function prayerOriginLabel(prayer: Prayer, bookTitle?: string, traditionTitle?: string) {
  const parts = [
    prayer.sourceName || prayer.sourceOrigin || prayer.sourceType || "Unknown source",
    bookTitle ? `Book: ${bookTitle}` : "",
    traditionTitle ? `Religion: ${traditionTitle}` : "",
  ].filter(Boolean);
  return parts.join(" • ");
}

function normalizeImport(data: any): Tradition[] {
  const sourceName = data?.libraryName || data?.name || data?.title || "Imported Library";

  const rawTraditions = Array.isArray(data?.traditions)
    ? data.traditions
    : Array.isArray(data?.libraries)
    ? data.libraries
    : [];

  if (rawTraditions.length > 0) {
    return rawTraditions.map((tradition: any, traditionIndex: number) => {
      const traditionTitle = tradition?.title || tradition?.name || tradition?.tradition || tradition?.religion || `Tradition ${traditionIndex + 1}`;
      const rawBooks = Array.isArray(tradition?.books)
        ? tradition.books
        : Array.isArray(tradition?.prayers)
        ? [{ id: "general", title: "General", prayers: tradition.prayers }]
        : [];

      return {
        id: tradition?.id || `${slugify(traditionTitle)}_${traditionIndex}`,
        title: traditionTitle,
        books: rawBooks.map((book: any, bookIndex: number) => {
          const bookTitle = book?.title || book?.name || book?.category || `Book ${bookIndex + 1}`;
          return {
            id: book?.id || `${slugify(bookTitle)}_${bookIndex}`,
            title: bookTitle,
            prayers: (Array.isArray(book?.prayers) ? book.prayers : []).map((prayer: any, prayerIndex: number) =>
              normalizePrayerItem(prayer, prayerIndex, sourceName, data?.sourceOrigin || data?.sourceType || "json_import")
            ),
          };
        }),
      };
    }).filter((tradition: Tradition) => tradition.books.some((book) => book.prayers.length > 0));
  }

  if (Array.isArray(data?.prayers)) {
    const traditionTitle = data?.religion
      ? `${data.religion}${data?.tradition ? ` - ${data.tradition}` : ""}`
      : sourceName;

    return [{
      id: data?.libraryId || slugify(sourceName),
      title: traditionTitle,
      books: [{
        id: "general",
        title: data?.libraryName || data?.tradition || "General",
        prayers: data.prayers.map((prayer: any, prayerIndex: number) =>
          normalizePrayerItem(prayer, prayerIndex, sourceName, data?.sourceOrigin || data?.sourceType || "json_import")
        ),
      }],
    }];
  }

  return [];
}

function traditionsArrayToDbObject(traditions: Tradition[]) {
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
              prayers: Object.fromEntries(
                book.prayers.map((prayer) => [prayer.id, { ...prayer }])
              ),
            },
          ])
        ),
      },
    ])
  );
}

function traditionsDbObjectToArray(value: any): Tradition[] {
  if (!value || typeof value !== "object") return [];

  return Object.entries(value)
    .map(([traditionKey, tradition]: [string, any]) => ({
      id: tradition?.id || traditionKey,
      title:
        tradition?.title ||
        (traditionKey === "custom_collections"
          ? "Custom Collections"
          : traditionKey === "christian_bible"
          ? "Christian Bible"
          : traditionKey === "jewish_prayer_books"
          ? "Jewish Prayer Books"
          : traditionKey === "jewish_texts"
          ? "Jewish Texts (Sefaria)"
          : traditionKey === "quran"
          ? "Quran"
          : traditionKey.replace(/_/g, " ")),
      books: tradition?.books
        ? Object.entries(tradition.books).map(([bookKey, book]: [string, any]) => ({
            id: book?.id || bookKey,
            title:
              book?.title ||
              (bookKey === "saved_sequences"
                ? "Saved Sequences"
                : bookKey.replace(/_/g, " ")),
            prayers: book?.prayers
              ? Object.entries(book.prayers).map(([prayerKey, prayer]: [string, any]) => ({
                  ...(prayer && typeof prayer === "object" ? prayer : {}),
                  id: prayer?.id || prayerKey,
                  title: prayer?.title || prayerKey.replace(/_/g, " "),
                  language: prayer?.language || "en",
                  originalText: prayer?.originalText || prayer?.text || "",
                  translationEnglish: prayer?.translationEnglish || prayer?.translation || "",
                  sourceType: prayer?.sourceType || "",
                  sourceName: prayer?.sourceName || "",
                  sourceOrigin: prayer?.sourceOrigin || prayer?.sourceType || "",
                }))
              : [],
          }))
        : [],
    }))
    .filter((tradition) => tradition.id)
    .filter((tradition) => tradition.books.length > 0);
}

function findTradition(traditions: Tradition[], traditionId: string) {
  return traditions.find((t) => t.id === traditionId) ?? null;
}

function findBook(traditions: Tradition[], traditionId: string, bookId: string) {
  return findTradition(traditions, traditionId)?.books.find((b) => b.id === bookId) ?? null;
}

function findPrayer(
  traditions: Tradition[],
  traditionId: string,
  bookId: string,
  prayerId: string
) {
  return findBook(traditions, traditionId, bookId)?.prayers.find((p) => p.id === prayerId) ?? null;
}

function getFirstSelectable(traditions: Tradition[]) {
  const firstTradition = traditions[0] ?? null;
  const firstBook = firstTradition?.books[0] ?? null;
  const firstPrayer = firstBook?.prayers[0] ?? null;

  return {
    traditionId: firstTradition?.id ?? "",
    bookId: firstBook?.id ?? "",
    prayerId: firstPrayer?.id ?? "",
  };
}

function cleanEntities(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&thinsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x05C0;/gi, "׀");
}

function stripHtmlAndArtifacts(text: string) {
  return cleanEntities(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/\{0\}/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function flattenAnyText(value: any): string {
  if (Array.isArray(value)) return value.map(flattenAnyText).join(" ").trim();
  if (typeof value === "string") return stripHtmlAndArtifacts(value);
  return "";
}

function mergeTraditions(existing: Tradition[], incoming: Tradition[]): Tradition[] {
  const traditionMap = new Map<string, Tradition>();

  for (const tradition of existing) {
    traditionMap.set(tradition.id, {
      ...tradition,
      books: tradition.books.map((b) => ({
        ...b,
        prayers: [...b.prayers],
      })),
    });
  }

  for (const tradition of incoming) {
    const currentTradition = traditionMap.get(tradition.id);

    if (!currentTradition) {
      traditionMap.set(tradition.id, {
        ...tradition,
        books: tradition.books.map((b) => ({
          ...b,
          prayers: [...b.prayers],
        })),
      });
      continue;
    }

    const bookMap = new Map<string, Book>();
    for (const b of currentTradition.books) {
      bookMap.set(b.id, {
        ...b,
        prayers: [...b.prayers],
      });
    }

    for (const incomingBook of tradition.books) {
      const currentBook = bookMap.get(incomingBook.id);

      if (!currentBook) {
        bookMap.set(incomingBook.id, {
          ...incomingBook,
          prayers: [...incomingBook.prayers],
        });
        continue;
      }

      const prayerMap = new Map<string, Prayer>();
      for (const p of currentBook.prayers) {
        prayerMap.set(p.id, { ...p });
      }

      for (const incomingPrayer of incomingBook.prayers) {
        prayerMap.set(incomingPrayer.id, { ...incomingPrayer });
      }

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

function normalizeWordForMatch(word: string) {
  return word
    .toLowerCase()
    .replace(/[.,!?;:"'”“’()[\]{}<>|/\\\-_=+*&^%$#@~`]/g, "")
    .replace(/\s+/g, "")
    .trim();
}


const SKIPPABLE_VOICE_WORDS = new Set([
  "a",
  "an",
  "and",
  "be",
  "for",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "to",
]);

function isSkippableVoiceWord(word: string) {
  return SKIPPABLE_VOICE_WORDS.has(word);
}

function speechLangForPrayer(prayer?: Prayer | null) {
  const lang = prayer?.language?.toLowerCase() || "";
  if (lang.startsWith("he")) return "he-IL";
  if (lang.startsWith("ar")) return "ar-SA";
  return "en-US";
}

export default function MasterPage() {
  const { language, t } = useLanguage();
  const [traditions, setTraditions] = useState<Tradition[]>([]);
  const [selectedTraditionId, setSelectedTraditionId] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedPrayerId, setSelectedPrayerId] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [session, setSessionState] = useState<SessionState | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserProfile, setCurrentUserProfile] = useState<AppUserProfile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(600);
  const [status, setStatus] = useState("idle");
  const [savedReligionId, setSavedReligionId] = useState("");
  const [religionSaveMessage, setReligionSaveMessage] = useState("");
  const [jsonUrl, setJsonUrl] = useState("");
  const [selectedJsonFileName, setSelectedJsonFileName] = useState("");
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [isImportingLibrary, setIsImportingLibrary] = useState(false);
  const [importProgressText, setImportProgressText] = useState("");
  const [importSummary, setImportSummary] = useState("");
  const [activeMenuPanel, setActiveMenuPanel] = useState<"config" | "prayers" | "help" | "about">("config");
  const [activePrayerTool, setActivePrayerTool] = useState<"library" | "list" | "speech" | "sermon">("list");
  const [contentFilterType, setContentFilterType] = useState<"all" | "book" | "prayer" | "speech" | "sermon">("all");
  const [contentFilterText, setContentFilterText] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [groqVoiceSupported, setGroqVoiceSupported] = useState(false);
  const [isBraveBrowser, setIsBraveBrowser] = useState(false);
  const [voiceEngine, setVoiceEngine] = useState<VoiceEngine>("browser");
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [sequenceName, setSequenceName] = useState("");
  const [sequenceItems, setSequenceItems] = useState<SequenceItem[]>([]);
  const [customPrayerTitle, setCustomPrayerTitle] = useState("");
  const [customPrayerText, setCustomPrayerText] = useState("");
  const [customPrayerTranslation, setCustomPrayerTranslation] = useState("");
  const [editingPrayerId, setEditingPrayerId] = useState("");
  const [editPrayerTitle, setEditPrayerTitle] = useState("");
  const [editPrayerText, setEditPrayerText] = useState("");
  const [editPrayerTranslation, setEditPrayerTranslation] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [prayerSubmenuOpen, setPrayerSubmenuOpen] = useState(false);
  const [autoNextSectionByVoice, setAutoNextSectionByVoice] = useState(true);
  const [prayerFontSize, setPrayerFontSize] = useState(28);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showVoiceDebug, setShowVoiceDebug] = useState(true);
  const [voiceDebug, setVoiceDebug] = useState<VoiceDebugState>({
    note: "idle",
    heardTokens: "",
    matchedWord: "",
    matchedAt: -1,
    advancedTo: -1,
    scannedFrom: -1,
    transcriptUpdatedAt: "",
  });
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const groqAllChunksRef = useRef<GroqAudioChunk[]>([]);
  const groqRecordingStartedAtRef = useRef(0);
  const groqChunkSeqRef = useRef(0);
  const groqLastProcessedSeqRef = useRef(0);
  const groqLastTranscriptTokensRef = useRef<string[]>([]);
  const voiceWantedRef = useRef(false);
  const voiceRestartTimerRef = useRef<number | null>(null);
  const transcriptBufferRef = useRef<string[]>([]);
  const activePrayerRef = useRef<Prayer | null>(null);
  const sessionRefState = useRef<SessionState | null>(null);
  const sessionCodeRef = useRef("");

  const allLibraryPrayers = useMemo(() => {
    const items: Array<{ traditionId: string; bookId: string; traditionTitle: string; bookTitle: string; prayer: Prayer }> = [];
    for (const tradition of traditions) {
      for (const book of tradition.books || []) {
        for (const prayer of book.prayers || []) {
          items.push({ traditionId: tradition.id, bookId: book.id, traditionTitle: tradition.title, bookTitle: book.title, prayer });
        }
      }
    }
    return items;
  }, [traditions]);

  const existingSpeeches = useMemo(
    () => allLibraryPrayers.filter((item) => item.prayer.sourceType === "speech" || item.bookId === "speeches"),
    [allLibraryPrayers]
  );

  const existingSermons = useMemo(
    () => allLibraryPrayers.filter((item) => item.prayer.sourceType === "custom_sequence" || item.bookId === "saved_sequences"),
    [allLibraryPrayers]
  );

  const filteredContentBooks = useMemo(() => {
    const q = contentFilterText.trim().toLowerCase();
    return traditions
      .flatMap((tradition) => (tradition.books || []).map((book) => ({ tradition, book })))
      .filter(({ tradition, book }) => {
        if (contentFilterType !== "all" && contentFilterType !== "book") return false;
        if (!q) return true;
        return [
          book.title,
          book.id,
          tradition.title,
          tradition.id,
          ...(book.prayers || []).map((prayer) => prayer.title).slice(0, 10),
        ].join(" ").toLowerCase().includes(q);
      });
  }, [traditions, contentFilterText, contentFilterType]);

  const filteredContentItems = useMemo(() => {
    const q = contentFilterText.trim().toLowerCase();
    return allLibraryPrayers.filter(({ traditionTitle, bookTitle, prayer }) => {
      const label = contentTypeLabel(prayer).toLowerCase() as "prayer" | "speech" | "sermon";
      if (contentFilterType !== "all" && contentFilterType !== label) return false;
      if (!q) return true;
      return [
        label,
        prayer.title,
        prayer.originalText,
        prayer.translationEnglish,
        prayer.notes,
        prayer.category,
        Array.isArray(prayer.tags) ? prayer.tags.join(" ") : "",
        prayer.sourceType,
        prayer.sourceName,
        prayer.sourceOrigin,
        bookTitle,
        traditionTitle,
      ].filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [allLibraryPrayers, contentFilterText, contentFilterType]);

  function datedDefaultName(prefix: string) {
    return `${prefix} ${new Date().toLocaleDateString()}`;
  }

  useEffect(() => {
    const applyDebugTraceSetting = (value?: boolean) => {
      if (typeof value === "boolean") {
        setShowVoiceDebug(value);
        return;
      }
      const saved = window.localStorage.getItem(DEBUG_TRACE_STORAGE_KEY);
      setShowVoiceDebug(saved === null ? true : saved === "true");
    };

    applyDebugTraceSetting();

    const handleDebugTraceChanged = (event: Event) => {
      applyDebugTraceSetting((event as CustomEvent<boolean>).detail);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === DEBUG_TRACE_STORAGE_KEY) applyDebugTraceSetting();
    };

    window.addEventListener(DEBUG_TRACE_CHANGED_EVENT, handleDebugTraceChanged as EventListener);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(DEBUG_TRACE_CHANGED_EVENT, handleDebugTraceChanged as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    let redirectTimer: number | null = null;

    const clearRedirectTimer = () => {
      if (redirectTimer !== null) {
        window.clearTimeout(redirectTimer);
        redirectTimer = null;
      }
    };

    const unsub = subscribeToAuth(async (user) => {
      try {
        if (!user) {
          // Do not immediately throw the user back to /auth. Firebase can briefly
          // report null while restoring or refreshing the browser session.
          // A delayed redirect prevents a temporary auth blip from becoming a real logout.
          clearRedirectTimer();
          redirectTimer = window.setTimeout(() => {
            window.location.href = "/auth?next=/master";
          }, 2500);
          setAuthReady(false);
          return;
        }

        clearRedirectTimer();
        setCurrentUserEmail(user.email || "");

        const profile = await getCurrentUserProfile(user.uid);
        setCurrentUserProfile(profile);
        setPlanCookie(profile);
        setAuthReady(true);
      } catch (error) {
        console.error("Master auth/profile load failed:", error);
        setAuthReady(true);
      }
    });

    return () => {
      clearRedirectTimer();
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!authReady || !currentUserProfile) return;

    const isDeveloperOwner =
      currentUserProfile.role === "owner" ||
      currentUserEmail.trim().toLowerCase() === "vdumpa972@gmail.com";

    if (!isDeveloperOwner) {
      setShowVoiceDebug(false);
    }

    setPlanCookie(currentUserProfile);

    if (currentUserProfile.plan === "free") {
      window.location.href = "/plans?from=master";
      return;
    }

    if (isTrialExpired(currentUserProfile)) {
      window.location.href = "/subscription?trialExpired=1";
      return;
    }
  }, [authReady, currentUserProfile]);

  useEffect(() => {
    const libraryRef = ref(db, "library/traditions");

    const unsub = onValue(libraryRef, (snapshot) => {
      const data = traditionsDbObjectToArray(snapshot.val());
      setTraditions(data);

      if (!data.length) {
        setSelectedTraditionId("");
        setSelectedBookId("");
        setSelectedPrayerId("");
        return;
      }

      const first = getFirstSelectable(data);
      const savedTraditionId = window.localStorage.getItem(SAVED_RELIGION_STORAGE_KEY) || "";
      setSavedReligionId(savedTraditionId);
      const nextTraditionId = data.some((t) => t.id === selectedTraditionId)
        ? selectedTraditionId
        : data.some((t) => t.id === savedTraditionId)
          ? savedTraditionId
          : first.traditionId;

      const nextTradition = data.find((t) => t.id === nextTraditionId) ?? data[0];
      const nextBookId = nextTradition.books.some((b) => b.id === selectedBookId)
        ? selectedBookId
        : nextTradition.books[0]?.id ?? "";

      const nextBook =
        nextTradition.books.find((b) => b.id === nextBookId) ?? nextTradition.books[0] ?? null;

      const nextPrayerId = nextBook?.prayers.some((p) => p.id === selectedPrayerId)
        ? selectedPrayerId
        : nextBook?.prayers[0]?.id ?? "";

      setSelectedTraditionId(nextTraditionId);
      setSelectedBookId(nextBookId);
      setSelectedPrayerId(nextPrayerId);
    });

    return () => unsub();
  }, [selectedTraditionId, selectedBookId, selectedPrayerId]);

  useEffect(() => {
    if (!sessionCode) return;

    const sessionRef = ref(db, `sessions/${sessionCode}`);
    const unsub = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSessionState(data);
      } else {
        setSessionState(null);
        setStatus(`session disappeared: ${sessionCode}`);
      }
    });

    return () => unsub();
  }, [sessionCode]);

  useEffect(() => {
    if (!isPlaying || !sessionCode || !session) return;

    const maxIndex = Math.max(splitWords(session.text).length - 1, 0);
    if (session.currentIndex >= maxIndex) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(async () => {
      await update(ref(db, `sessions/${sessionCode}`), {
        currentIndex: Math.min(session.currentIndex + 1, maxIndex),
        updatedAt: Date.now(),
      });
    }, speedMs);

    return () => clearTimeout(timer);
  }, [isPlaying, speedMs, sessionCode, session]);

  const selectedTradition = findTradition(traditions, selectedTraditionId);
  const selectedBook = findBook(traditions, selectedTraditionId, selectedBookId);
  const activePrayer = findPrayer(
    traditions,
    selectedTraditionId,
    selectedBookId,
    selectedPrayerId
  );

  const currentSection = useMemo(() => {
    if (!session?.sections?.length) return null;
    const index = session.currentSectionIndex ?? 0;
    return session.sections[index] ?? null;
  }, [session]);

  const words = useMemo(
    () => splitWords(session?.text ?? activePrayer?.originalText ?? ""),
    [session, activePrayer]
  );

  const currentIndex = session?.currentIndex ?? 0;

  const canUseVoiceDebug =
    currentUserProfile?.role === "owner" ||
    currentUserEmail.trim().toLowerCase() === "vdumpa972@gmail.com";


const debugSnapshot = {
  sessionCode: sessionCode || "(none)",
  selectedPrayer: activePrayer?.title || "(none)",
  prayerLanguage: activePrayer?.language || "(none)",
  speechRecognitionLanguage: speechLangForPrayer(activePrayer),
  speechSupported,
  groqVoiceSupported,
  isBraveBrowser,
  voiceEngine,
  isListening,
  status,
  isPlaying,
  currentIndex,
  totalWords: words.length,
  currentWord: words[currentIndex] || "(none)",
  autoNextSectionByVoice,
  showTranslation,
  prayerFontSize,
  lastTranscript: lastTranscript || "(empty)",
  voiceDebug,
  voiceWanted: voiceWantedRef.current,
};





  useEffect(() => {
    activePrayerRef.current = activePrayer;
    sessionRefState.current = session;
    sessionCodeRef.current = sessionCode;
  }, [activePrayer, session, sessionCode]);

function findBestPhraseAdvance(
  prayerWords: string[],
  spokenTokens: string[],
  startIndex: number
) {
  const normalizedPrayerWords = prayerWords.map(normalizeWordForMatch).filter(Boolean);
  const normalizedSpokenTokens = spokenTokens.map(normalizeWordForMatch).filter(Boolean);

  const windowStart = Math.max(0, startIndex);
  const windowEnd = Math.min(normalizedPrayerWords.length, startIndex + 18);

  let bestMatches = 0;
  let bestStart = -1;
  let bestEnd = startIndex;
  let bestSkips = Number.MAX_SAFE_INTEGER;
  let bestSpokenStart = -1;

  for (let i = windowStart; i < windowEnd; i++) {
    for (let j = 0; j < normalizedSpokenTokens.length; j++) {
      let prayerIdx = i;
      let spokenIdx = j;
      let matches = 0;
      let skips = 0;
      let end = i;

      while (
        prayerIdx < normalizedPrayerWords.length &&
        prayerIdx < windowEnd &&
        spokenIdx < normalizedSpokenTokens.length
      ) {
        const prayerToken = normalizedPrayerWords[prayerIdx];
        const spokenToken = normalizedSpokenTokens[spokenIdx];

        if (prayerToken === spokenToken) {
          matches += 1;
          prayerIdx += 1;
          spokenIdx += 1;
          end = prayerIdx;
          continue;
        }

        const canSkipPrayer = isSkippableVoiceWord(prayerToken) && skips < 2;
        const canSkipSpoken = isSkippableVoiceWord(spokenToken) && skips < 2;

        if (canSkipPrayer) {
          prayerIdx += 1;
          skips += 1;
          continue;
        }

        if (canSkipSpoken) {
          spokenIdx += 1;
          skips += 1;
          continue;
        }

        break;
      }

      const betterMatch =
        matches > bestMatches ||
        (matches === bestMatches && matches > 0 && end > bestEnd) ||
        (matches === bestMatches && end === bestEnd && skips < bestSkips);

      if (betterMatch) {
        bestMatches = matches;
        bestStart = i;
        bestEnd = end;
        bestSkips = skips;
        bestSpokenStart = j;
      }
    }
  }

  return {
    bestLength: bestMatches,
    bestStart,
    bestEnd,
    bestSpokenStart,
  };
}


function groqLanguageForPrayer(prayer: Prayer | null) {
  const lang = (speechLangForPrayer(prayer) || "en-US").toLowerCase();
  if (lang.startsWith("he")) return "he";
  if (lang.startsWith("ar")) return "ar";
  if (lang.startsWith("es")) return "es";
  return "en";
}

function getPreferredAudioMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function audioFileNameForMimeType(mimeType: string) {
  if (mimeType.includes("mp4")) return "speech.m4a";
  if (mimeType.includes("ogg")) return "speech.ogg";
  if (mimeType.includes("wav")) return "speech.wav";
  return "speech.webm";
}

const GROQ_SEND_INTERVAL_MS = 3500;
const GROQ_MAX_AUDIO_WINDOW_MS = 20000;

type GroqAudioChunk = {
  blob: Blob;
  startedAtMs: number;
  endedAtMs: number;
};

function findTokenOverlap(previousTokens: string[], currentTokens: string[]) {
  const maxOverlap = Math.min(previousTokens.length, currentTokens.length);
  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    let matches = true;
    for (let i = 0; i < overlap; i += 1) {
      if (previousTokens[previousTokens.length - overlap + i] !== currentTokens[i]) {
        matches = false;
        break;
      }
    }
    if (matches) return overlap;
  }
  return 0;
}

function processVoiceTranscriptText(transcript: string, note = "transcript received") {
  const cleanedTranscript = transcript.trim();
  setLastTranscript(cleanedTranscript);

  const partialTokens = splitWords(cleanedTranscript)
    .map(normalizeWordForMatch)
    .filter(Boolean);

  if (!partialTokens.length) {
    setVoiceDebug((prev: VoiceDebugState) => ({
      ...prev,
      note: "empty transcript",
      transcriptUpdatedAt: new Date().toISOString(),
    }));
    return;
  }

  const mergedBuffer = [...transcriptBufferRef.current, ...partialTokens].slice(-24);
  transcriptBufferRef.current = mergedBuffer;

  setVoiceDebug((prev: VoiceDebugState) => ({
    ...prev,
    note,
    heardTokens: mergedBuffer.join(" | "),
    transcriptUpdatedAt: new Date().toISOString(),
  }));

  void handleVoiceTranscript(mergedBuffer);
}

useEffect(() => {

  if (typeof window === "undefined") return;

  const w = window as any;
  const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition || null;
  // Groq/Whisper fallback is intentionally disabled. The experiment worked, but
  // the delayed batch transcription was not good enough for live follower sync.
  // Chrome should use the browser SpeechRecognition path only. Brave may still
  // expose webkitSpeechRecognition, but if it returns network errors we now show
  // that error instead of switching to Groq.
  const canUseGroqVoice = false;

  setGroqVoiceSupported(false);
  setSpeechSupported(Boolean(SpeechRecognitionCtor));

  if (w.navigator?.brave && typeof w.navigator.brave.isBrave === "function") {
    void w.navigator.brave.isBrave().then((isBrave: boolean) => {
      setIsBraveBrowser(Boolean(isBrave));
      setVoiceEngine("browser");
    }).catch(() => {});
  }

  if (!SpeechRecognitionCtor) {
    return;
  }

  const recognition: SpeechRecognitionLike = new SpeechRecognitionCtor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = speechLangForPrayer(activePrayerRef.current);

  recognition.onresult = (event: any) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript + " ";
    }

    processVoiceTranscriptText(transcript, "browser speech transcript received");
  };

  recognition.onerror = (event: any) => {
    console.error("Speech error:", event);
    const errorCode = String(event?.error || "unknown");

    setIsListening(false);
    setStatus(`voice error: ${errorCode}`);
    setVoiceDebug((prev: VoiceDebugState) => ({
      ...prev,
      note: `speech error: ${errorCode}`,
      transcriptUpdatedAt: new Date().toISOString(),
    }));
  };

  recognition.onend = () => {
    if (voiceRestartTimerRef.current !== null) {
      window.clearTimeout(voiceRestartTimerRef.current);
      voiceRestartTimerRef.current = null;
    }

    if (voiceWantedRef.current) {
      // Chrome often ends SpeechRecognition after a short silence.
      // Keep the UI in Listening mode and restart quietly so it does not flip
      // between "Stopped" and "Listening" every half second.
      setIsListening(true);
      setStatus("voice listening...");
      setVoiceDebug((prev: VoiceDebugState) => ({
        ...prev,
        note: "speech recognition waiting; quiet restart scheduled",
        transcriptUpdatedAt: new Date().toISOString(),
      }));

      voiceRestartTimerRef.current = window.setTimeout(() => {
        voiceRestartTimerRef.current = null;
        if (!voiceWantedRef.current || !recognitionRef.current) return;

        try {
          recognitionRef.current.lang = speechLangForPrayer(activePrayerRef.current);
          recognitionRef.current.start();
          setIsListening(true);
          setStatus("voice listening...");
          setVoiceDebug((prev: VoiceDebugState) => ({
            ...prev,
            note: "speech recognition listening",
            transcriptUpdatedAt: new Date().toISOString(),
          }));
        } catch (error: any) {
          const message = String(error?.message || error || "");
          if (message.toLowerCase().includes("already started")) {
            setIsListening(true);
            setStatus("voice listening...");
            return;
          }

          console.error(error);
          voiceWantedRef.current = false;
          setIsListening(false);
          setStatus("voice stopped");
          setVoiceDebug((prev: VoiceDebugState) => ({
            ...prev,
            note: "speech restart failed; stopped",
            transcriptUpdatedAt: new Date().toISOString(),
          }));
        }
      }, 1500);
    } else {
      setIsListening(false);
      setStatus("voice stopped");
      setVoiceDebug((prev: VoiceDebugState) => ({
        ...prev,
        note: "speech recognition ended",
        transcriptUpdatedAt: new Date().toISOString(),
      }));
    }
  };

  recognitionRef.current = recognition;

  return () => {
    try {
      voiceWantedRef.current = false;
      if (voiceRestartTimerRef.current !== null) {
        window.clearTimeout(voiceRestartTimerRef.current);
        voiceRestartTimerRef.current = null;
      }
      recognition.stop();
      stopGroqVoiceRecognition();
    } catch {}
  };
}, [groqVoiceSupported]);

async function handleVoiceTranscript(bufferTokens: string[]) {
  const sessionCode = sessionCodeRef.current;
  const currentSession = sessionRefState.current;
  if (!sessionCode || !currentSession) {
    setVoiceDebug((prev: VoiceDebugState) => ({
      ...prev,
      note: "ignored transcript: no active session",
      transcriptUpdatedAt: new Date().toISOString(),
    }));
    return;
  }

  if (!bufferTokens.length) {
    setVoiceDebug((prev: VoiceDebugState) => ({
      ...prev,
      note: "ignored transcript: empty buffer",
      transcriptUpdatedAt: new Date().toISOString(),
    }));
    return;
  }

  const prayerWords = splitWords(currentSession.text);
  const startIdx = currentSession.currentIndex;
  const { bestLength, bestStart, bestEnd, bestSpokenStart } = findBestPhraseAdvance(
    prayerWords,
    bufferTokens,
    startIdx
  );

  const matchedWord = prayerWords[Math.max(bestEnd - 1, 0)] || "";
  const matchedIsWeak = isSkippableVoiceWord(normalizeWordForMatch(matchedWord));
  const spokenTooLate = bestSpokenStart > 1;
  const transcriptTooLongForSingleWord = bufferTokens.length > 3 && bestLength < 2;
  const weakSingleWordMatch = bestLength < 2 && matchedIsWeak;

  if (bestLength > 0 && bestEnd !== currentSession.currentIndex && !spokenTooLate && !transcriptTooLongForSingleWord && !weakSingleWordMatch) {
    setVoiceDebug({
      note:
        bestLength > 1
          ? "anchored phrase match advanced current word"
          : "anchored single-word match advanced current word",
      heardTokens: bufferTokens.join(" | "),
      matchedWord,
      matchedAt: bestStart,
      advancedTo: bestEnd,
      scannedFrom: startIdx,
      transcriptUpdatedAt: new Date().toISOString(),
    });

    transcriptBufferRef.current = [];

    await update(ref(db, `sessions/${sessionCode}`), {
      currentIndex: Math.min(bestEnd, Math.max(prayerWords.length - 1, 0)),
      updatedAt: Date.now(),
    });
    return;
  }

  setVoiceDebug({
    note: bestLength > 0
      ? spokenTooLate
        ? "ignored transcript: prayer words started too late in speech"
        : transcriptTooLongForSingleWord
          ? "ignored transcript: only one prayer word found inside a longer sentence"
          : weakSingleWordMatch
            ? "ignored transcript: weak single-word match"
            : "no advance from transcript"
      : "no advance from transcript",
    heardTokens: bufferTokens.join(" | "),
    matchedWord,
    matchedAt: bestStart,
    advancedTo: startIdx,
    scannedFrom: startIdx,
    transcriptUpdatedAt: new Date().toISOString(),
  });
}

async function sendGroqAudioChunk(blob: Blob, sequenceNumber: number) {
  if (!voiceWantedRef.current || !blob.size) return;

  try {
    const formData = new FormData();
    const mimeType = blob.type || getPreferredAudioMimeType() || "audio/webm";
    formData.append("audio", blob, audioFileNameForMimeType(mimeType));
    formData.append("language", groqLanguageForPrayer(activePrayerRef.current));

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || `transcription failed (${response.status})`);
    }

    if (sequenceNumber <= groqLastProcessedSeqRef.current) {
      return;
    }
    groqLastProcessedSeqRef.current = sequenceNumber;

    const transcript = String(data?.text || "").trim();
    if (!transcript) {
      setVoiceDebug((prev: VoiceDebugState) => ({
        ...prev,
        note: `Groq returned empty transcript for audio ${sequenceNumber}`,
        transcriptUpdatedAt: new Date().toISOString(),
      }));
      return;
    }

    const fullTokens = splitWords(transcript)
      .map(normalizeWordForMatch)
      .filter(Boolean);
    const previousTokens = groqLastTranscriptTokensRef.current;
    const overlapLength = findTokenOverlap(previousTokens, fullTokens);

    const newTokens = fullTokens.slice(overlapLength);
    groqLastTranscriptTokensRef.current = fullTokens;

    if (!newTokens.length) {
      setVoiceDebug((prev: VoiceDebugState) => ({
        ...prev,
        note: `Groq audio ${sequenceNumber}: no new words`,
        transcriptUpdatedAt: new Date().toISOString(),
      }));
      return;
    }

    processVoiceTranscriptText(newTokens.join(" "), `Groq cumulative audio ${sequenceNumber}: new words received`);
  } catch (error: any) {
    console.error(error);
    setStatus(`Groq voice error: ${error?.message || error}`);
    setVoiceDebug((prev: VoiceDebugState) => ({
      ...prev,
      note: `Groq voice error: ${error?.message || error}`,
      transcriptUpdatedAt: new Date().toISOString(),
    }));
  }
}

function startGroqRecordingSegment() {
  const stream = mediaStreamRef.current;
  if (!voiceWantedRef.current || !stream) return;

  const activeTracks = stream.getAudioTracks().filter((track) => track.readyState === "live");
  if (!activeTracks.length) {
    setStatus("Groq voice microphone stopped");
    return;
  }

  const mimeType = getPreferredAudioMimeType();
  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  mediaRecorderRef.current = recorder;
  groqAllChunksRef.current = [];
  groqRecordingStartedAtRef.current = Date.now();
  groqChunkSeqRef.current = 0;
  groqLastProcessedSeqRef.current = 0;
  groqLastTranscriptTokensRef.current = [];

  recorder.ondataavailable = (event: BlobEvent) => {
    if (!voiceWantedRef.current || !event.data?.size) return;

    const nowMs = Date.now();
    const recordingStartedAt = groqRecordingStartedAtRef.current || nowMs;
    const endedAtMs = nowMs - recordingStartedAt;
    const startedAtMs = Math.max(0, endedAtMs - GROQ_SEND_INTERVAL_MS);

    groqAllChunksRef.current.push({
      blob: event.data,
      startedAtMs,
      endedAtMs,
    });

    const windowStartMs = Math.max(0, endedAtMs - GROQ_MAX_AUDIO_WINDOW_MS);
    const selectedChunks = groqAllChunksRef.current.filter((chunk) => chunk.endedAtMs > windowStartMs);
    const finalMimeType = recorder.mimeType || mimeType || event.data.type || "audio/webm";
    const audioWindowFile = new Blob(selectedChunks.map((chunk) => chunk.blob), { type: finalMimeType });

    // Keep enough overlap for good transcription, but do not let the upload grow
    // forever. Before 20 seconds this sends 0→now. After 20 seconds it sends
    // the most recent ~20 seconds while the microphone keeps recording.
    if (audioWindowFile.size > 1500) {
      const sequenceNumber = groqChunkSeqRef.current + 1;
      groqChunkSeqRef.current = sequenceNumber;
      void sendGroqAudioChunk(audioWindowFile, sequenceNumber);
    }

    // Keep only chunks needed for the next 20-second sliding window.
    groqAllChunksRef.current = groqAllChunksRef.current.filter((chunk) => chunk.endedAtMs > windowStartMs - GROQ_SEND_INTERVAL_MS);
  };

  recorder.onerror = (event: Event) => {
    console.error("MediaRecorder error:", event);
    setStatus("Groq voice recorder error");
    setVoiceDebug((prev: VoiceDebugState) => ({
      ...prev,
      note: "Groq voice recorder error",
      transcriptUpdatedAt: new Date().toISOString(),
    }));
  };

  recorder.onstop = () => {
    if (mediaRecorderRef.current === recorder) mediaRecorderRef.current = null;
  };

  // Keep the microphone recorder running continuously. Every 3.5 seconds the
  // browser gives us the next encoded WebM/Opus piece. We send cumulative audio
  // during the first 20 seconds, then a sliding last-20-second window. Uploads
  // run in the background while recording continues.
  recorder.start(GROQ_SEND_INTERVAL_MS);
}

async function startGroqVoiceRecognition() {
  if (!groqVoiceSupported) {
    alert("Groq voice fallback is not available in this browser.");
    return;
  }

  if (!sessionCodeRef.current) {
    alert("Create a session first.");
    return;
  }

  if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
    setIsListening(true);
    setStatus("Groq voice listening...");
    return;
  }

  transcriptBufferRef.current = [];
  groqAllChunksRef.current = [];
  groqRecordingStartedAtRef.current = 0;
  groqChunkSeqRef.current = 0;
  groqLastProcessedSeqRef.current = 0;
  groqLastTranscriptTokensRef.current = [];
  voiceWantedRef.current = true;

  try {
    if (!mediaStreamRef.current) {
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    startGroqRecordingSegment();
    setVoiceEngine("groq");
    setIsListening(true);
    setStatus("Groq voice listening...");
    setVoiceDebug((prev: VoiceDebugState) => ({
      ...prev,
      note: isBraveBrowser
        ? "Brave detected; using Groq voice fallback"
        : "using Groq voice fallback",
      heardTokens: "",
      transcriptUpdatedAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    console.error(error);
    voiceWantedRef.current = false;
    setIsListening(false);
    setStatus(`could not start Groq voice: ${error?.message || error}`);
    setVoiceDebug((prev: VoiceDebugState) => ({
      ...prev,
      note: `could not start Groq voice: ${error?.message || error}`,
      transcriptUpdatedAt: new Date().toISOString(),
    }));
  }
}

function stopGroqVoiceRecognition() {
  voiceWantedRef.current = false;
  try {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  } catch {}

  mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  mediaStreamRef.current = null;
  mediaRecorderRef.current = null;
  groqAllChunksRef.current = [];
  groqRecordingStartedAtRef.current = 0;
}

function startVoiceRecognition() {
  if (!sessionCode) {
    alert("Create a session first.");
    return;
  }

  if (!speechSupported || !recognitionRef.current) {
    alert("Voice recognition is not supported in this browser. Use Chrome for live voice tracking.");
    return;
  }

  transcriptBufferRef.current = [];
  voiceWantedRef.current = true;
  if (voiceRestartTimerRef.current !== null) {
    window.clearTimeout(voiceRestartTimerRef.current);
    voiceRestartTimerRef.current = null;
  }

  try {
    stopGroqVoiceRecognition();
    recognitionRef.current.lang = speechLangForPrayer(activePrayerRef.current);
    recognitionRef.current.start();
    setVoiceEngine("browser");
    setIsListening(true);
    setStatus("voice listening...");
    setVoiceDebug((prev: VoiceDebugState) => ({
      ...prev,
      note: "speech recognition started",
      heardTokens: "",
      transcriptUpdatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error(error);
    setStatus("could not start voice recognition");
    setVoiceDebug((prev: VoiceDebugState) => ({
      ...prev,
      note: "speech start failed",
      transcriptUpdatedAt: new Date().toISOString(),
    }));
  }
}

function stopVoiceRecognition() {
  voiceWantedRef.current = false;
  transcriptBufferRef.current = [];
  if (voiceRestartTimerRef.current !== null) {
    window.clearTimeout(voiceRestartTimerRef.current);
    voiceRestartTimerRef.current = null;
  }

  try {
    recognitionRef.current?.stop();
  } catch {}
  stopGroqVoiceRecognition();

  setIsListening(false);
  setStatus("voice stopped");
  setVoiceDebug((prev: VoiceDebugState) => ({
    ...prev,
    note: "speech recognition stopped by user",
    transcriptUpdatedAt: new Date().toISOString(),
  }));
}

  async function saveMergedLibrary(incoming: Tradition[], successStatus: string, originLabel = "library import") {
    const snapshot = await get(ref(db, "library/traditions"));
    const existing = traditionsDbObjectToArray(snapshot.val());
    const merged = mergeTraditions(existing, incoming);

    await set(ref(db, "library/traditions"), traditionsArrayToDbObject(merged));

    const firstIncoming = getFirstSelectable(incoming);
    if (firstIncoming.traditionId) {
      setSelectedTraditionId(firstIncoming.traditionId);
      setSelectedBookId(firstIncoming.bookId);
      setSelectedPrayerId(firstIncoming.prayerId);
    }

    setStatus(successStatus);
    const summary = summarizeTraditions(incoming, originLabel);
    setImportSummary(summary);
    setImportProgressText(successStatus);
    alert(summary);
  }

  async function mergeSampleLibrary() {
    if (!selectedTraditionId) {
      alert("Please choose and save a religion in Config first.");
      return;
    }
    const selectedSamples = sampleTraditionsForSelection(selectedTraditionId, selectedTradition?.title);
    if (!selectedSamples.length) {
      alert("No starter sample library is available for the selected religion.");
      return;
    }
    try {
      setIsImportingLibrary(true);
      setImportSummary("");
      setImportProgressText("Preparing starter JSON library for selected religion...");
      const totalBooks = selectedSamples.reduce((sum, tradition) => sum + tradition.books.length, 0);
      const totalItems = selectedSamples.reduce((sum, tradition) => sum + tradition.books.reduce((bookSum, book) => bookSum + book.prayers.length, 0), 0);
      setImportProgressText(`Loading selected religion starter JSON: ${selectedSamples.map((t) => t.title).join(", ")} — ${totalBooks} books, ${totalItems} items...`);
      await saveMergedLibrary(selectedSamples, `starter JSON library added: ${totalBooks} books / ${totalItems} items`, `Starter JSON Library for ${selectedTradition?.title || selectedTraditionId}`);
    } catch (err) {
      console.error(err);
      setImportProgressText("Could not add starter JSON library.");
      setStatus("starter JSON library failed");
    } finally {
      setIsImportingLibrary(false);
    }
  }

  async function replaceSampleLibrary() {
    if (!selectedTraditionId) {
      alert("Please choose and save a religion in Config first.");
      return;
    }
    const selectedSamples = sampleTraditionsForSelection(selectedTraditionId, selectedTradition?.title);
    if (!selectedSamples.length) {
      alert("No starter sample library is available for the selected religion.");
      return;
    }
    if (!confirm(`Replace the selected religion starter content with ${selectedSamples.map((t) => t.title).join(", ")}?`)) return;
    try {
      setIsImportingLibrary(true);
      setImportSummary("");
      const totalBooks = selectedSamples.reduce((sum, tradition) => sum + tradition.books.length, 0);
      const totalItems = selectedSamples.reduce((sum, tradition) => sum + tradition.books.reduce((bookSum, book) => bookSum + book.prayers.length, 0), 0);
      setImportProgressText(`Replacing selected starter JSON: ${totalBooks} books, ${totalItems} items...`);
      const snapshot = await get(ref(db, "library/traditions"));
      const existing = traditionsDbObjectToArray(snapshot.val()).filter((tradition) => !selectedSamples.some((sample) => sample.id === tradition.id));
      const merged = [...existing, ...selectedSamples];
      await set(ref(db, "library/traditions"), traditionsArrayToDbObject(merged));
      const first = getFirstSelectable(selectedSamples);
      setSelectedTraditionId(first.traditionId);
      setSelectedBookId(first.bookId);
      setSelectedPrayerId(first.prayerId);
      const summary = summarizeTraditions(selectedSamples, `Starter JSON Library replacement for ${selectedTradition?.title || selectedTraditionId}`);
      setStatus(`starter JSON replaced selected religion: ${totalBooks} books / ${totalItems} items`);
      setImportSummary(summary);
      setImportProgressText("Starter JSON library loaded and saved.");
      alert(summary);
    } catch (err) {
      console.error(err);
      setImportProgressText("Could not replace library.");
      setStatus("replace library failed");
    } finally {
      setIsImportingLibrary(false);
    }
  }

  async function loadQuranFromAPI() {
    setStatus("Loading Quran...");

    try {
      const listRes = await fetch("https://api.alquran.cloud/v1/surah");
      const listJson = await listRes.json();
      const surahs = listJson?.data || [];
      const selectedSurahs = surahs.slice(0, 10);
      const books: Book[] = [];

      for (const surah of selectedSurahs) {
        const arabicRes = await fetch(`https://api.alquran.cloud/v1/surah/${surah.number}`);
        const arabicJson = await arabicRes.json();

        const englishRes = await fetch(
          `https://api.alquran.cloud/v1/surah/${surah.number}/en.asad`
        );
        const englishJson = await englishRes.json();

        const arabicAyahs = arabicJson?.data?.ayahs || [];
        const englishAyahs = englishJson?.data?.ayahs || [];

        books.push({
          id: `surah_${surah.number}`,
          title: `${surah.number}. ${surah.englishName}`,
          prayers: [
            {
              id: `surah_${surah.number}_full`,
              title: surah.englishName,
              language: "ar",
              originalText: arabicAyahs.map((a: any) => a.text).join(" "),
              translationEnglish: englishAyahs.map((a: any) => a.text).join(" "),
              sourceType: "api",
              sourceName: "AlQuran Cloud",
            },
          ],
        });
      }

      await saveMergedLibrary([{ id: "quran", title: "Quran", books }], "Quran merged");
    } catch (err) {
      console.error(err);
      alert("Failed to load Quran");
      setStatus("Failed to load Quran");
    }
  }

  async function loadBibleFromAPI() {
    setStatus("Loading Bible...");

    try {
      const starterBooks = [
        { id: "genesis", title: "Genesis", reference: "Genesis 1" },
        { id: "psalms", title: "Psalms", reference: "Psalm 23" },
        { id: "psalm91", title: "Psalm 91", reference: "Psalm 91" },
        { id: "psalm121", title: "Psalm 121", reference: "Psalm 121" },
        { id: "john", title: "John", reference: "John 1" },
        { id: "matthew", title: "Matthew", reference: "Matthew 5" },
        { id: "corinthians", title: "1 Corinthians", reference: "1 Corinthians 13" },
      ];

      const books: Book[] = [];

      for (const item of starterBooks) {
        const res = await fetch(
          `https://bible-api.com/${encodeURIComponent(item.reference)}?translation=web`
        );
        const json = await res.json();

        books.push({
          id: item.id,
          title: item.title,
          prayers: [
            {
              id: `${item.id}_starter`,
              title: item.reference,
              language: "en",
              originalText: (json.text || "").trim(),
              translationEnglish: json.reference || item.reference,
              sourceType: "api",
              sourceName: "Bible API",
            },
          ],
        });
      }

      await saveMergedLibrary(
        [{ id: "christian_bible", title: "Christian Bible", books }],
        "Bible merged"
      );
    } catch (err) {
      console.error(err);
      alert("Failed to load Bible");
      setStatus("Failed to load Bible");
    }
  }

  async function loadJewishFromSefaria() {
    setStatus("Loading Jewish texts...");

    try {
      const starterRefs = [
        { id: "deuteronomy_6_4_9", bookId: "torah", bookTitle: "Torah", prayerTitle: "Deuteronomy 6:4-9", refText: "Deuteronomy 6:4-9" },
        { id: "numbers_15_37_41", bookId: "torah", bookTitle: "Torah", prayerTitle: "Numbers 15:37-41", refText: "Numbers 15:37-41" },
        { id: "psalm_23", bookId: "tehillim", bookTitle: "Tehillim / Psalms", prayerTitle: "Psalm 23", refText: "Psalms 23" },
        { id: "psalm_121", bookId: "tehillim", bookTitle: "Tehillim / Psalms", prayerTitle: "Psalm 121", refText: "Psalms 121" },
        { id: "psalm_130", bookId: "tehillim", bookTitle: "Tehillim / Psalms", prayerTitle: "Psalm 130", refText: "Psalms 130" },
        { id: "psalm_150", bookId: "tehillim", bookTitle: "Tehillim / Psalms", prayerTitle: "Psalm 150", refText: "Psalms 150" },
      ];

      const bookMap = new Map<string, Book>();

      for (const item of starterRefs) {
        const res = await fetch(
          `https://www.sefaria.org/api/texts/${encodeURIComponent(item.refText)}`
        );
        const json = await res.json();

        const hebrew = flattenAnyText(json.he);
        const english = flattenAnyText(json.text);

        const prayer: Prayer = {
          id: item.id,
          title: item.prayerTitle,
          language: "he",
          originalText: hebrew || english,
          translationEnglish: english || "",
          sourceType: "api",
          sourceName: "Sefaria",
        };

        const existingBook = bookMap.get(item.bookId);
        if (existingBook) {
          existingBook.prayers.push(prayer);
        } else {
          bookMap.set(item.bookId, {
            id: item.bookId,
            title: item.bookTitle,
            prayers: [prayer],
          });
        }
      }

      await saveMergedLibrary(
        [{
          id: "jewish_texts",
          title: "Jewish Texts (Sefaria)",
          books: Array.from(bookMap.values()),
        }],
        "Jewish texts merged"
      );
    } catch (err) {
      console.error(err);
      alert("Failed to load Jewish texts");
      setStatus("Failed to load Jewish texts");
    }
  }

  function addSelectedPrayerToSequence() {
    if (!activePrayer) {
      alert("Select a prayer first.");
      return;
    }

    setSequenceItems((prev) => [
      ...prev,
      {
        id: `${activePrayer.id}_${Date.now()}`,
        title: activePrayer.title,
        originalText: activePrayer.originalText,
        translationEnglish: activePrayer.translationEnglish || "",
        sourceLabel: `${selectedTradition?.title || ""} / ${selectedBook?.title || ""}`,
        language: activePrayer.language,
      },
    ]);

    setStatus(`added "${activePrayer.title}" to sequence`);
  }

  function addCustomPrayerToSequence() {
    if (!customPrayerTitle.trim() || !customPrayerText.trim()) {
      alert("Enter custom prayer title and text first.");
      return;
    }

    setSequenceItems((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        title: customPrayerTitle.trim(),
        originalText: customPrayerText.trim(),
        translationEnglish: customPrayerTranslation.trim(),
        sourceLabel: "Custom text",
        language: "mixed",
      },
    ]);

    setCustomPrayerTitle("");
    setCustomPrayerText("");
    setCustomPrayerTranslation("");
    setStatus("custom prayer added to sequence");
  }

  function moveSequenceItemUp(index: number) {
    if (index === 0) return;
    setSequenceItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveSequenceItemDown(index: number) {
    setSequenceItems((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function removeSequenceItem(id: string) {
    setSequenceItems((prev) => prev.filter((item) => item.id !== id));
  }

  function clearSequence() {
    setSequenceItems([]);
    setSequenceName("");
    setStatus("sequence cleared");
  }

  function getAccountDisplayLabel(profile: AppUserProfile) {
    if (profile.plan === "trial" || profile.subscriptionType === "trial" || profile.subscriptionStatus === "trialing") {
      return "trial user";
    }
    return getDisplayRole(profile.role, language);
  }

  function openMenuPanel(panel: "config" | "prayers" | "help" | "about") {
    setActiveMenuPanel(panel);
    setPrayerSubmenuOpen(false);
    setMenuOpen(true);
  }

  function cancelMenuPanel() {
    setMenuOpen(false);
    setPrayerSubmenuOpen(false);
  }

  function addPrayerToSequence(prayer: Prayer, sourceLabel: string) {
    setSequenceItems((prev) => [
      ...prev,
      {
        id: `${prayer.id}_${Date.now()}_${prev.length}`,
        title: prayer.title,
        originalText: prayer.originalText || prayer.sections?.map((section) => section.text).join("\n\n") || "",
        translationEnglish: prayer.translationEnglish || prayer.sections?.map((section) => section.translationEnglish || "").join("\n\n") || "",
        sourceLabel,
        language: prayer.language,
      },
    ]);
    setStatus(`added "${prayer.title}" to sermon`);
  }

  async function saveSpeech() {
    const title = (customPrayerTitle.trim() || datedDefaultName("Speech")).trim();
    const text = customPrayerText.trim();
    if (!text) {
      alert("Enter speech text first.");
      return;
    }
    const prayerId = slugify(title);
    const speech: Prayer = {
      id: prayerId,
      title,
      language: "mixed",
      originalText: text,
      translationEnglish: customPrayerTranslation.trim(),
      sourceType: "speech",
      sourceName: "Master Menu",
      sourceOrigin: "created in app",
    };

    const customSnapshot = await get(ref(db, "library/traditions/custom_collections"));
    const existingCustom = customSnapshot.val() || {};
    const existingSequences = existingCustom?.books?.saved_sequences?.prayers || {};
    const existingSpeeches = existingCustom?.books?.speeches?.prayers || {};

    await set(ref(db, "library/traditions/custom_collections"), {
      ...existingCustom,
      id: "custom_collections",
      title: "Custom Collections",
      books: {
        ...(existingCustom?.books || {}),
        saved_sequences: {
          ...(existingCustom?.books?.saved_sequences || {}),
          id: "saved_sequences",
          title: "Saved Sequences",
          prayers: existingSequences,
        },
        speeches: {
          ...(existingCustom?.books?.speeches || {}),
          id: "speeches",
          title: "Speeches",
          prayers: { ...existingSpeeches, [prayerId]: speech },
        },
      },
    });

    setCustomPrayerTitle("");
    setCustomPrayerText("");
    setCustomPrayerTranslation("");
    setSelectedTraditionId("custom_collections");
    setSelectedBookId("speeches");
    setSelectedPrayerId(prayerId);
    setStatus(`saved speech "${title}"`);
  }

  function saveSelectedReligion() {
    if (!selectedTraditionId) {
      alert("Select a religion first.");
      return;
    }
    window.localStorage.setItem(SAVED_RELIGION_STORAGE_KEY, selectedTraditionId);
    setSavedReligionId(selectedTraditionId);
    const savedName = selectedTradition?.title || selectedTraditionId;
    setReligionSaveMessage(`Religion saved: ${savedName}`);
    setStatus(`religion saved: ${savedName}`);
  }

  function startEditPrayer(prayer: Prayer) {
    setEditingPrayerId(prayer.id);
    setEditPrayerTitle(prayer.title);
    setEditPrayerText(prayer.originalText || prayer.sections?.map((section) => section.text).join("\n\n") || "");
    setEditPrayerTranslation(prayer.translationEnglish || prayer.sections?.map((section) => section.translationEnglish || "").join("\n\n") || "");
  }

  async function saveEditedPrayer() {
    if (!selectedTraditionId || !selectedBookId) {
      alert("Select a religion and prayer book first.");
      return;
    }
    const title = editPrayerTitle.trim();
    const text = editPrayerText.trim();
    if (!title || !text) {
      alert("Prayer title and text are required.");
      return;
    }
    const prayerId = editingPrayerId || slugify(title);
    const existingPrayer = editingPrayerId
      ? selectedBook?.prayers.find((prayer) => prayer.id === editingPrayerId)
      : null;
    const prayer: Prayer = {
      ...(existingPrayer || {}),
      id: prayerId,
      title,
      language: existingPrayer?.language || activePrayer?.language || "mixed",
      originalText: text,
      translationEnglish: editPrayerTranslation.trim(),
      sourceType: editingPrayerId ? (existingPrayer?.sourceType || "edited") : "custom_prayer",
      sourceName: editingPrayerId ? (existingPrayer?.sourceName || "Master Menu") : "Master Menu",
      sourceOrigin: editingPrayerId ? (existingPrayer?.sourceOrigin || existingPrayer?.sourceName || "edited in app") : "created in app",
      updatedAt: Date.now(),
    };
    await set(ref(db, `library/traditions/${selectedTraditionId}/books/${selectedBookId}/prayers/${prayerId}`), prayer);
    setSelectedPrayerId(prayerId);
    setEditingPrayerId(prayerId);
    setStatus("prayer saved");
  }


  async function deletePrayerWithConfirm(traditionId: string, bookId: string, prayer: Prayer) {
    if (!traditionId || !bookId || !prayer?.id) return;
    const ok = confirm(`Delete "${prayer.title}"?\n\nThis cannot be undone.`);
    if (!ok) return;
    await set(ref(db, `library/traditions/${traditionId}/books/${bookId}/prayers/${prayer.id}`), null);
    if (selectedPrayerId === prayer.id) {
      const book = findBook(traditions, traditionId, bookId);
      const nextPrayer = book?.prayers.find((p) => p.id !== prayer.id);
      setSelectedPrayerId(nextPrayer?.id || "");
    }
    setEditingPrayerId("");
    setEditPrayerTitle("");
    setEditPrayerText("");
    setEditPrayerTranslation("");
    setStatus(`deleted ${prayer.title}`);
  }

  async function deleteSelectedBookWithConfirm() {
    if (!selectedTraditionId || !selectedBookId || !selectedBook) return;
    const ok = confirm(`Delete the whole book/library "${selectedBook.title}" and all prayers inside it?\n\nThis cannot be undone.`);
    if (!ok) return;
    await set(ref(db, `library/traditions/${selectedTraditionId}/books/${selectedBookId}`), null);
    const remainingBooks = selectedTradition?.books.filter((book) => book.id !== selectedBookId) || [];
    const nextBook = remainingBooks[0];
    setSelectedBookId(nextBook?.id || "");
    setSelectedPrayerId(nextBook?.prayers[0]?.id || "");
    setStatus(`deleted book/library ${selectedBook.title}`);
  }

  async function saveCustomSequence() {
    const name = sequenceName.trim();
    if (!name) {
      alert("Enter a sequence name first.");
      return;
    }
    if (!sequenceItems.length) {
      alert("Add prayers to the sequence first.");
      return;
    }

    const prayerId = slugify(name);
    const combinedOriginal = sequenceItems
      .map((item) => `${item.title}\n${item.originalText}`)
      .join("\n\n");

    const combinedTranslation = sequenceItems
      .map((item) =>
        item.translationEnglish ? `${item.title}\n${item.translationEnglish}` : item.title
      )
      .join("\n\n");

    const prayer: Prayer = {
      id: prayerId,
      title: name,
      language: "mixed",
      originalText: combinedOriginal,
      translationEnglish: combinedTranslation,
      sourceType: "custom_sequence",
      sourceName: "Custom Builder",
      sourceOrigin: "created in app",
    };

    const customSnapshot = await get(ref(db, "library/traditions/custom_collections"));
    const existingCustom = customSnapshot.val() || {};
    const existingPrayers = existingCustom?.books?.saved_sequences?.prayers || {};

    await set(ref(db, "library/traditions/custom_collections"), {
      ...existingCustom,
      id: "custom_collections",
      title: "Custom Collections",
      books: {
        ...(existingCustom?.books || {}),
        saved_sequences: {
          ...(existingCustom?.books?.saved_sequences || {}),
          id: "saved_sequences",
          title: "Saved Sequences",
          prayers: {
            ...existingPrayers,
            [prayerId]: prayer,
          },
        },
      },
    });

    setSequenceItems([]);
    setSequenceName("");
    setSelectedTraditionId("custom_collections");
    setSelectedBookId("saved_sequences");
    setSelectedPrayerId(prayerId);
    setStatus(`saved custom sequence "${name}"`);
  }

  async function handleJsonImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedJsonFileName(file.name);
    setIsImportingLibrary(true);
    setImportSummary("");
    setImportProgressText(`Reading ${file.name}...`);
    setStatus(`importing ${file.name}...`);

    try {
      const raw = await file.text();
      setImportProgressText(`Parsing ${file.name}...`);
      const parsed = JSON.parse(raw) as PrayerImportFile;
      const normalized = normalizeImport({ ...(parsed as any), sourceOrigin: `uploaded file: ${file.name}` });

      if (!normalized.length) {
        setImportProgressText("No prayers found in this JSON file.");
        alert("No prayers found in this JSON file. The app accepts either { traditions: [...] } or a simple library like { libraryName, religion, prayers: [...] }. Please check the file format.");
        return;
      }

      const prayerCount = normalized.reduce((sum, tradition) => sum + tradition.books.reduce((bookSum, book) => bookSum + book.prayers.length, 0), 0);
      setImportProgressText(`Saving ${prayerCount} prayers from ${file.name} to Firebase...`);
      await saveMergedLibrary(normalized, `imported ${file.name}: ${prayerCount} prayers`, `uploaded file: ${file.name}`);
      setImportProgressText(`Done: imported ${file.name} (${prayerCount} prayers).`);
      e.target.value = "";
    } catch (error) {
      console.error(error);
      setImportProgressText("Could not import JSON file. Check the format.");
      alert("Could not import JSON file. Check that the file is valid JSON in the prayer-library format.");
      setStatus("JSON file import failed");
    } finally {
      setIsImportingLibrary(false);
    }
  }

  async function importJsonFromUrl() {
    const url = jsonUrl.trim();
    if (!url) {
      alert("Enter a JSON URL first.");
      return;
    }

    setIsImportingUrl(true);
    setImportSummary("");
    setImportProgressText("Loading JSON from URL...");
    setStatus("loading JSON from URL...");

    try {
      const res = await fetch("/api/load-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result?.error || `HTTP ${res.status}`);
      }

      setImportProgressText("Parsing remote JSON...");
      const normalized = normalizeImport({ ...(result.data as any), sourceOrigin: `URL: ${url}` } as PrayerImportFile);
      if (!normalized.length) {
        alert("No prayers found in JSON from URL. The app accepts either { traditions: [...] } or a simple library like { libraryName, religion, prayers: [...] }.");
        setStatus("no prayers found in remote JSON");
        setImportProgressText("No prayers found in remote JSON.");
        return;
      }

      const prayerCount = normalized.reduce((sum, tradition) => sum + tradition.books.reduce((bookSum, book) => bookSum + book.prayers.length, 0), 0);
      setImportProgressText(`Saving ${prayerCount} prayers from URL to Firebase...`);
      await saveMergedLibrary(normalized, `URL imported: ${prayerCount} prayers`, `URL: ${url}`);
      setImportProgressText(`Done: URL library imported (${prayerCount} prayers).`);
      setJsonUrl("");
    } catch (error: any) {
      console.error(error);
      alert(`Could not load JSON from URL: ${error?.message || "unknown error"}`);
      setStatus("URL import failed");
      setImportProgressText(`URL import failed: ${error?.message || "unknown error"}`);
    } finally {
      setIsImportingUrl(false);
    }
  }

  async function createSession() {
    if (!activePrayer) {
      alert("Choose a prayer first");
      return;
    }

    setIsPlaying(false);
    const code = randomCode();

    const newSession: SessionState = {
      code,
      traditionId: selectedTraditionId,
      bookId: selectedBookId,
      prayerId: activePrayer.id,
      prayerTitle: activePrayer.title,
      language: activePrayer.language,
      currentIndex: 0,
      text: activePrayer.originalText,
      translationEnglish: activePrayer.translationEnglish || "",
      updatedAt: Date.now(),
    };

    await set(ref(db, `sessions/${code}`), newSession);
    setSessionCode(code);
    setStatus(`session ${code} created`);
  }

  async function applySelectedPrayerToSession() {
    if (!sessionCode || !activePrayer) return;

    setIsPlaying(false);

    await update(ref(db, `sessions/${sessionCode}`), {
      traditionId: selectedTraditionId,
      bookId: selectedBookId,
      prayerId: activePrayer.id,
      prayerTitle: activePrayer.title,
      language: activePrayer.language,
      text: activePrayer.originalText,
      translationEnglish: activePrayer.translationEnglish || "",
      currentIndex: 0,
      updatedAt: Date.now(),
    });

    setStatus(`session ${sessionCode} updated`);
  }

  async function nextWord() {
    if (!sessionCode || !session) return;
    const maxIndex = Math.max(splitWords(session.text).length - 1, 0);

    await update(ref(db, `sessions/${sessionCode}`), {
      currentIndex: Math.min(currentIndex + 1, maxIndex),
      updatedAt: Date.now(),
    });
  }

  async function prevWord() {
    if (!sessionCode || !session) return;

    await update(ref(db, `sessions/${sessionCode}`), {
      currentIndex: Math.max(currentIndex - 1, 0),
      updatedAt: Date.now(),
    });
  }

  async function resetWords() {
    if (!sessionCode) return;
    setIsPlaying(false);

    await update(ref(db, `sessions/${sessionCode}`), {
      currentIndex: 0,
      updatedAt: Date.now(),
    });
  }

  const buildVersion =
    (globalThis as any)?.process?.env?.NEXT_PUBLIC_BUILD_VERSION || 'dev';

  const readingBackgroundImage = getReligionReadingBackground(
    selectedTraditionId,
    activePrayer?.title,
    activePrayer?.language
  );

  const styles = {
    page: {
      fontFamily: 'Arial, Helvetica, sans-serif',
      background: 'transparent',
      minHeight: '100vh',
      padding: 0,
      color: '#111827',
    } as const,
    shell: { maxWidth: '100%', margin: '0 auto' } as const,
    topBand: {
      background: 'rgba(5, 5, 5, 0.68)',
      padding: '12px 14px 6px 14px',
      minHeight: 78,
    } as const,
    topRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      flexWrap: 'wrap',
    } as const,
    brandWrap: { display: 'flex', flexDirection: 'column', gap: 4 } as const,
    title: { margin: 0, fontSize: 30, fontWeight: 700, color: '#f3f4f6' } as const,
    subtitle: { margin: 0, color: '#9ca3af', fontSize: 13 } as const,
    menuBtn: {
      width: 48,
      height: 48,
      borderRadius: 8,
      border: '1px solid #334155',
      background: '#0f172a',
      cursor: 'pointer',
      fontSize: 24,
      fontWeight: 700,
      color: '#e5e7eb',
    } as const,
    topMetaRow: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      alignItems: 'center',
      marginTop: 6,
    } as const,
    mainWithSidebar: {
      display: 'grid',
      gridTemplateColumns: '190px minmax(0, 1fr)',
      gap: 12,
      alignItems: 'start',
    } as const,
    persistentMenu: {
      position: 'sticky',
      top: 0,
      alignSelf: 'start',
      minHeight: 'calc(100vh - 0px)',
      background: 'rgba(247, 243, 232, 0.96)',
      borderRight: '1px solid #cbb894',
      padding: 12,
      display: 'grid',
      alignContent: 'start',
      gap: 8,
    } as const,
    menuPanel: {
      position: 'fixed',
      left: 202,
      top: 96,
      zIndex: 50,
      background: 'rgba(247, 243, 232, 0.98)',
      border: '1px solid #cbb894',
      borderRadius: 14,
      padding: 14,
      boxShadow: '0 12px 32px rgba(0,0,0,0.22)',
      width: 'min(920px, calc(100vw - 230px))',
      maxWidth: 'calc(100vw - 230px)',
      maxHeight: 'calc(100vh - 120px)',
      overflow: 'hidden',
    } as const,
    menuBackdrop: {
      position: 'fixed',
      inset: 0,
      zIndex: 40,
      background: 'transparent',
    } as const,
    menuNav: { display: 'grid', alignContent: 'start', gap: 8 } as const,
    menuContent: { minWidth: 0, maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' as const } as const,
    menuGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: 16 } as const,
    controlGrid: {
      display: 'grid',
      gridTemplateColumns: '1.35fr 0.8fr 0.95fr 1fr',
      gap: 10,
      width: '100%',
      alignItems: 'stretch',
    } as const,
    cardTitleRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 8,
    } as const,
    infoIcon: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 20,
      height: 20,
      borderRadius: '50%',
      border: '1px solid #cbb894',
      background: '#f8fafc',
      color: '#1d4ed8',
      fontSize: 13,
      fontWeight: 800,
      fontFamily: 'Georgia, serif',
      cursor: 'help',
      flex: '0 0 auto',
    } as const,
    compactSelectGrid: { display: 'grid', gap: 7 } as const,
    compactSelect: {
      width: '100%',
      padding: '7px 9px',
      border: '1px solid #cbb894',
      borderRadius: 8,
      background: '#fffaf0',
      color: '#111827',
      fontSize: 14,
    } as const,
    sectionCard: {
      background: 'rgba(247, 243, 232, 0.82)',
      border: '1px solid #cbb894',
      borderRadius: 14,
      padding: 14,
      boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
      backdropFilter: 'blur(2px)',
    } as const,
    commandStrip: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
    } as const,
    commandGroup: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      alignItems: 'center',
    } as const,
    groupTitle: { fontSize: 14, fontWeight: 700, marginRight: 2 } as const,
    buttonRow: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' } as const,
    smallBtn: {
      padding: '8px 12px',
      borderRadius: 0,
      border: '1px solid #d6d0c0',
      background: '#efe9db',
      color: '#1f2937',
      cursor: 'pointer',
      fontWeight: 500,
      minWidth: 0,
      fontSize: 15,
    } as const,
    primaryBtn: {
      padding: '8px 12px',
      borderRadius: 0,
      border: '1px solid #d6d0c0',
      background: '#efe9db',
      color: '#111827',
      cursor: 'pointer',
      fontWeight: 500,
      minWidth: 0,
      fontSize: 15,
    } as const,
    successBtn: {
      padding: '8px 12px',
      borderRadius: 0,
      border: '1px solid #d6d0c0',
      background: '#efe9db',
      color: '#111827',
      cursor: 'pointer',
      fontWeight: 500,
      minWidth: 0,
      fontSize: 15,
    } as const,
    noticeBox: {
      padding: '10px 12px',
      borderRadius: 8,
      border: '1px solid #86efac',
      background: '#dcfce7',
      color: '#166534',
      fontWeight: 700,
    } as const,
    dangerBtn: {
      padding: '8px 12px',
      borderRadius: 0,
      border: '1px solid #d6d0c0',
      background: '#efe9db',
      color: '#111827',
      cursor: 'pointer',
      fontWeight: 500,
      minWidth: 0,
      fontSize: 15,
    } as const,
    amberBtn: {
      padding: '8px 12px',
      borderRadius: 0,
      border: '1px solid #d6d0c0',
      background: '#efe9db',
      color: '#111827',
      cursor: 'pointer',
      fontWeight: 500,
      minWidth: 0,
      fontSize: 15,
    } as const,
    mutedBtn: {
      padding: '8px 12px',
      borderRadius: 0,
      border: '1px solid #d6d0c0',
      background: '#efe9db',
      color: '#111827',
      cursor: 'pointer',
      fontWeight: 500,
      minWidth: 0,
      fontSize: 15,
    } as const,
    layout: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: 16,
      padding: '0 0 20px 0',
    } as const,
    prayerSection: {
      background: 'rgba(247, 247, 247, 0.82)',
      border: '2px solid #355d93',
      borderRadius: 0,
      padding: 18,
      margin: '0 0 0 0',
      minHeight: 'calc(100vh - 190px)',
      display: 'flex',
      flexDirection: 'column',
    } as const,
    translationSection: {
      background: 'rgba(247, 247, 247, 0.82)',
      border: '2px solid #355d93',
      borderRadius: 0,
      padding: 18,
      margin: '0 0 0 0',
      minHeight: 260,
      display: 'flex',
      flexDirection: 'column',
    } as const,
    sectionHeaderRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
      flexWrap: 'wrap',
      marginBottom: 8,
    } as const,
    sectionTitle: { fontSize: 24, fontWeight: 400, margin: 0, color: '#111827', textShadow: '0 1px 2px rgba(255,255,255,0.92)' } as const,
    sectionSubTitle: { fontSize: 18, fontWeight: 400, margin: 0, color: '#111827' } as const,
    bookSpread: {
      display: 'grid',
      gridTemplateColumns: showTranslation ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
      gap: 0,
      marginTop: 12,
      border: '1px solid rgba(118, 86, 42, 0.72)',
      borderRadius: 18,
      overflow: 'hidden',
      background: `linear-gradient(90deg, rgba(255,255,255,0.26), rgba(255,255,255,0.34) 47%, rgba(92,65,30,0.24) 50%, rgba(255,255,255,0.34) 53%, rgba(255,255,255,0.26)), linear-gradient(rgba(255,255,255,0.18), rgba(255,255,255,0.24)), url("${readingBackgroundImage}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      boxShadow: '0 18px 38px rgba(38, 26, 12, 0.32), inset 0 0 40px rgba(95, 62, 24, 0.18)',
      flex: 1,
      minHeight: 360,
    } as const,
    bookPage: {
      padding: 24,
      background: 'radial-gradient(circle at top left, rgba(255,255,255,0.44), transparent 34%), rgba(255, 248, 226, 0.20)',
      minHeight: 360,
      display: 'flex',
      flexDirection: 'column',
    } as const,
    bookPageLeft: {
      borderRight: showTranslation ? '2px solid rgba(116, 82, 38, 0.30)' : 'none',
      boxShadow: showTranslation ? 'inset -16px 0 22px rgba(78, 50, 20, 0.12)' : 'none',
    } as const,
    bookPageRight: {
      boxShadow: 'inset 16px 0 22px rgba(78, 50, 20, 0.12)',
    } as const,
    bookPageTitle: {
      marginBottom: 12,
      fontSize: 22,
      fontWeight: 700,
      color: '#111827',
      textShadow: '0 1px 2px rgba(255,255,255,0.95)',
      borderBottom: '1px solid rgba(116, 82, 38, 0.28)',
      paddingBottom: 8,
    } as const,
    prayerBox: {
      border: 'none',
      borderRadius: 0,
      background: 'transparent',
      padding: 0,
      minHeight: 260,
      maxHeight: 'none',
      overflowY: 'auto',
      lineHeight: 1.45,
      whiteSpace: 'normal',
      wordBreak: 'break-word',
      color: '#050505',
      textShadow: '0 1px 2px rgba(255,255,255,0.96)',
      flex: 1,
    } as const,
    translationBox: {
      border: 'none',
      borderRadius: 0,
      background: 'transparent',
      padding: 0,
      minHeight: 180,
      maxHeight: 'none',
      overflowY: 'auto',
      lineHeight: 1.5,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      color: '#050505',
      textShadow: '0 1px 2px rgba(255,255,255,0.96)',
      flex: 1,
    } as const,
    infoBox: {
      border: 'none',
      borderRadius: 0,
      padding: '0 0 4px 0',
      background: 'transparent',
      lineHeight: 1.45,
      color: '#1f2937',
    } as const,
    input: {
      width: '100%',
      padding: 10,
      borderRadius: 8,
      border: '1px solid #bda98b',
      fontSize: 15,
      boxSizing: 'border-box' as const,
      background: 'white',
    },
    filePickerRow: {
      display: 'grid',
      gridTemplateColumns: 'auto minmax(180px, 1fr)',
      gap: 10,
      alignItems: 'center',
      marginTop: 12,
    } as const,
    fileNameBox: {
      minHeight: 38,
      border: '1px solid #bda98b',
      borderRadius: 8,
      background: 'white',
      padding: '8px 10px',
      color: '#374151',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box' as const,
    } as const,
    textarea: {
      width: '100%',
      padding: 10,
      borderRadius: 8,
      border: '1px solid #bda98b',
      fontSize: 15,
      boxSizing: 'border-box' as const,
      background: 'white',
      resize: 'vertical' as const,
    },
    select: {
      width: '100%',
      padding: 10,
      borderRadius: 8,
      border: '1px solid #bda98b',
      fontSize: 15,
      background: 'white',
    },
    label: { fontWeight: 700, marginBottom: 6, display: 'block', fontSize: 14 } as const,
    badge: {
      display: 'inline-block',
      padding: '5px 10px',
      background: '#111827',
      color: '#e5e7eb',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      border: '1px solid #374151',
    } as const,
    seqItem: { border: '1px solid #d8c9ae', borderRadius: 10, padding: 12, background: 'rgba(255, 253, 248, 0.84)' } as const,
    toolbarLabel: {
      fontSize: 16,
      fontWeight: 400,
      color: '#111827',
      marginRight: 2,
    } as const,
    toggleBtn: {
      padding: '8px 12px',
      borderRadius: 0,
      border: '1px solid #d6d0c0',
      background: '#efe9db',
      color: '#111827',
      cursor: 'pointer',
      fontWeight: 500,
      minWidth: 0,
      fontSize: 15,
    } as const,
    checkboxLabel: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      fontSize: 18,
      fontWeight: 400,
      color: '#111827',
    } as const,
    prayerMeta: {
      fontSize: 17,
      marginTop: 2,
      color: '#111827',
    } as const,
    debugBox: {
      marginTop: 12,
      padding: 12,
      border: '1px solid #94a3b8',
      background: 'rgba(255,255,255,0.80)',
      fontFamily: 'Consolas, Monaco, monospace',
      fontSize: 13,
      lineHeight: 1.45,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    } as const,
    debugToggleRow: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: 8,
    } as const,
  };


  if (
    !authReady ||
    (currentUserProfile
      ? currentUserProfile.plan === "free" || isTrialExpired(currentUserProfile)
      : false)
  ) {
    return (
      <div style={{ padding: 24, fontFamily: "Arial, Helvetica, sans-serif" }}>
        {t("master.checkingAccess")}
      </div>
    );
  }


  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.topBand}>
          <div style={styles.topRow}>
            <div style={styles.brandWrap}>
              <h1 style={styles.title}>{t("master.title")}</h1>
              <div style={styles.topMetaRow}>
                <span style={styles.badge}>{t("common.build")}: {buildVersion}</span>
                <span style={styles.badge}>{t("common.status")}: {status}</span>
                {sessionCode ? <span style={styles.badge}>{t("common.session")}: {sessionCode}</span> : null}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              padding: "12px 16px",
              background: "rgba(248, 250, 252, 0.84)",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              marginTop: 12,
              fontFamily: "Arial, Helvetica, sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16 }}>
              <span style={{ fontSize: 20 }}>👤</span>
              <span>
                {currentUserEmail}
                {currentUserProfile ? " (" + getAccountDisplayLabel(currentUserProfile) + ")" : ""}
              </span>
            </div>

            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              {currentUserProfile?.role === "owner" ? (
                <>
                  <a href="/owner" style={{ color: "#1d4ed8", textDecoration: "underline" }}>
                    Account Management
                  </a>
                  <a href="/auth?next=/super-admin&ownerRelogin=1" style={{ color: "#1d4ed8", textDecoration: "underline" }}>
                    Super Admin
                  </a>
                </>
              ) : null}

              <a href="/profile" style={{ color: "#1d4ed8", textDecoration: "underline" }}>
                {t("common.profile")}
              </a>

              <button
                onClick={() => signOutUser().then(() => (window.location.href = "/auth"))}
                style={{
                  border: "1px solid #cbd5e1",
                  background: "rgba(255, 255, 255, 0.86)",
                  borderRadius: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: 15,
                }}
              >
                {t("common.signOut")}
              </button>
            </div>
          </div>

        </div>

        <div style={styles.mainWithSidebar}>
          <aside style={styles.persistentMenu} onClick={(event) => event.stopPropagation()}>
            <div style={styles.sectionTitle}>{t("master.menu")}</div>
            <button style={styles.smallBtn} onClick={() => openMenuPanel("config")}>Config</button>
            <button
              style={{ ...styles.smallBtn, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => {
                setActiveMenuPanel("prayers");
                setMenuOpen(false);
                setPrayerSubmenuOpen((open) => !open);
              }}
            >
              <span>Prayers</span><span>{prayerSubmenuOpen ? "▼" : "▶"}</span>
            </button>
            {prayerSubmenuOpen ? (
              <div style={{ display: 'grid', gap: 6, marginLeft: 12, marginTop: -2, marginBottom: 4 }}>
                <button style={styles.smallBtn} onClick={() => { setActivePrayerTool("library"); openMenuPanel("prayers"); }}>Add prayer library</button>
                <button style={styles.smallBtn} onClick={() => { setActivePrayerTool("list"); openMenuPanel("prayers"); }}>Current content / edit</button>
                <button style={styles.smallBtn} onClick={() => { setActivePrayerTool("speech"); if (!customPrayerTitle) setCustomPrayerTitle(datedDefaultName("Speech")); openMenuPanel("prayers"); }}>Create new speech</button>
                <button style={styles.smallBtn} onClick={() => { setActivePrayerTool("sermon"); if (!sequenceName) setSequenceName(datedDefaultName("Sermon")); openMenuPanel("prayers"); }}>Prepare a sermon</button>
              </div>
            ) : null}
            <button style={styles.smallBtn} onClick={() => openMenuPanel("help")}>{t("master.help")}</button>
            <button style={styles.smallBtn} onClick={() => openMenuPanel("about")}>{t("master.about")}</button>
          </aside>

          <main style={{ minWidth: 0 }} onClick={() => { if (menuOpen || prayerSubmenuOpen) cancelMenuPanel(); }}>
            {menuOpen && <div style={styles.menuBackdrop} onClick={cancelMenuPanel} />}
            {menuOpen && (
              <div style={styles.menuPanel} onClick={(event) => event.stopPropagation()}>
                <div style={styles.menuContent}>
                  {activeMenuPanel === "config" && (
                    <div style={styles.sectionCard}>
                      <div style={styles.cardTitleRow}>
                        <div style={styles.sectionTitle}>Config</div>
                        <button style={styles.smallBtn} onClick={cancelMenuPanel}>Cancel</button>
                      </div>
                      <label style={styles.label}>{t("master.religionTradition")}</label>
                      <select value={selectedTraditionId} onChange={(e) => {
                        const traditionId = e.target.value;
                        const tradition = findTradition(traditions, traditionId);
                        const firstBook = tradition?.books[0] ?? null;
                        const firstPrayer = firstBook?.prayers[0] ?? null;
                        setSelectedTraditionId(traditionId);
                        setSelectedBookId(firstBook?.id ?? '');
                        setSelectedPrayerId(firstPrayer?.id ?? '');
                        setReligionSaveMessage('');
                      }} style={styles.select}>
                        <option value="">{t("master.selectReligion")}</option>
                        {traditions.map((tradition) => <option key={tradition.id} value={tradition.id}>{tradition.title}</option>)}
                      </select>
                      <div style={{ marginTop: 12 }}>
                        <button style={styles.successBtn} onClick={saveSelectedReligion}>Save selected religion</button>
                      </div>
                      {religionSaveMessage ? (
                        <div style={{ ...styles.noticeBox, marginTop: 12 }}>{religionSaveMessage}</div>
                      ) : null}
                    </div>
                  )}

                  {activeMenuPanel === "prayers" && (
                    <div style={{ display: "grid", gap: 14 }}>
                      <div style={styles.cardTitleRow}>
                        <div style={styles.sectionTitle}>
                          {activePrayerTool === "library" ? "Add prayer library" : activePrayerTool === "speech" ? "Create new speech" : activePrayerTool === "sermon" ? "Prepare a sermon" : "Current content / edit"}
                        </div>
                        <button style={styles.smallBtn} onClick={cancelMenuPanel}>Cancel</button>
                      </div>

                      {activePrayerTool === "library" && (
                        <div style={styles.sectionCard}>
                          <div style={styles.sectionTitle}>Add prayer library</div>
                          <div style={{ ...styles.infoBox, marginBottom: 12 }}>
                            All libraries use the same JSON format. The sample starter library is loaded only for the religion currently selected in Config. You can also import a JSON file from your computer or paste a public JSON URL.
                          </div>
                          <div style={styles.buttonRow}>
                            <button style={styles.primaryBtn} disabled={isImportingLibrary} onClick={mergeSampleLibrary}>{isImportingLibrary ? "Loading selected sample..." : "Add sample library for selected religion"}</button>
                            <button style={styles.primaryBtn} disabled={isImportingLibrary} onClick={replaceSampleLibrary}>Replace selected religion sample library</button>
                            <button style={styles.smallBtn} onClick={() => setActivePrayerTool("list")}>Cancel</button>
                          </div>
                          <div style={styles.filePickerRow}>
                            <label style={{ ...styles.primaryBtn, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: isImportingLibrary ? 0.65 : 1 }}>
                              {isImportingLibrary ? "Loading JSON..." : "Choose JSON file"}
                              <input type="file" accept="application/json,.json" onChange={handleJsonImport} disabled={isImportingLibrary} style={{ display: 'none' }} />
                            </label>
                            <div style={styles.fileNameBox}>{selectedJsonFileName || "No file selected"}</div>
                          </div>
                          <div style={{ marginTop: 12 }}>
                            <label style={styles.label}>Import from public JSON URL</label>
                            <div style={{ ...styles.infoBox, marginBottom: 8 }}>
                              Paste the URL where your JSON file already lives. The app reads that URL and saves the prayers into Firebase; it does not create a new URL for you.
                            </div>
                            <div style={{ ...styles.buttonRow, alignItems: 'stretch' }}>
                              <input value={jsonUrl} onChange={(e) => setJsonUrl(e.target.value)} placeholder="https://example.com/prayer-library.json" style={{ ...styles.input, minWidth: 320, flex: 1 }} />
                              <button style={styles.successBtn} disabled={isImportingUrl} onClick={importJsonFromUrl}>{isImportingUrl ? "Loading..." : "Load and save URL library"}</button>
                            </div>
                          </div>
                          {(importProgressText || importSummary) && (
                            <div style={{ ...styles.sectionCard, marginTop: 12, whiteSpace: 'pre-wrap' }}>
                              {importProgressText ? <div style={{ fontWeight: 700, marginBottom: 8 }}>{importProgressText}</div> : null}
                              {importSummary ? <div>{importSummary}</div> : null}
                            </div>
                          )}
                          <div style={{ ...styles.infoBox, marginTop: 12 }}>
                            Online cross-religion starter API buttons were removed. Use the selected-religion sample library, JSON file import, or JSON URL import.
                          </div>
                        </div>
                      )}

                      {activePrayerTool === "list" && (
                        <>
                          <div style={styles.sectionCard}>
                            <div style={styles.sectionTitle}>Current content / edit</div>
                            <div style={{ ...styles.infoBox, marginBottom: 12 }}>
                              This list shows all books/libraries, prayers, sermons, and speeches currently saved in Firebase.
                            </div>
                            <div style={{ ...styles.sectionCard, marginBottom: 12 }}>
                              <div style={styles.sectionSubTitle}>Filter content</div>
                              <div style={{ ...styles.buttonRow, alignItems: 'stretch', marginTop: 8 }}>
                                <select
                                  value={contentFilterType}
                                  onChange={(e) => setContentFilterType(e.target.value as "all" | "book" | "prayer" | "speech" | "sermon")}
                                  style={{ ...styles.select, minWidth: 180, flex: '0 0 180px' }}
                                >
                                  <option value="all">All content</option>
                                  <option value="book">Books / libraries</option>
                                  <option value="prayer">Prayers</option>
                                  <option value="speech">Speeches</option>
                                  <option value="sermon">Sermons</option>
                                </select>
                                <input
                                  value={contentFilterText}
                                  onChange={(e) => setContentFilterText(e.target.value)}
                                  placeholder="Search by free text, title, book, religion, origin, or prayer text"
                                  style={{ ...styles.input, minWidth: 280, flex: 1 }}
                                />
                                <button style={styles.smallBtn} onClick={() => { setContentFilterType("all"); setContentFilterText(""); }}>Clear</button>
                              </div>
                              <div style={{ fontSize: 12, color: '#4b5563', marginTop: 8 }}>
                                Showing {filteredContentBooks.length} books/libraries and {filteredContentItems.length} items.
                              </div>
                            </div>
                            <div style={{ display: "grid", gap: 10 }}>
                              {filteredContentBooks.map(({ tradition, book }) => (
                                <div key={`${tradition.id}_${book.id}`} style={{ ...styles.smallBtn, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 8, alignItems: 'center', textAlign: 'left' }}>
                                  <button
                                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 15, color: '#1f2937' }}
                                    onClick={() => { setSelectedTraditionId(tradition.id); setSelectedBookId(book.id); setSelectedPrayerId(book.prayers[0]?.id || ""); }}
                                  >
                                    <div style={{ fontWeight: 800 }}>[Book] {book.title}</div>
                                    <div style={{ fontSize: 12, color: '#4b5563', marginTop: 3 }}>Religion: {tradition.title} • Items: {book.prayers.length}</div>
                                  </button>
                                  <button style={styles.dangerBtn} onClick={async () => {
                                    const ok = confirm(`Delete the whole book/library "${book.title}" and all items inside it?

This cannot be undone.`);
                                    if (!ok) return;
                                    await set(ref(db, `library/traditions/${tradition.id}/books/${book.id}`), null);
                                    if (selectedTraditionId === tradition.id && selectedBookId === book.id) {
                                      setSelectedBookId("");
                                      setSelectedPrayerId("");
                                    }
                                    setStatus(`deleted book/library ${book.title}`);
                                  }}>Delete book</button>
                                </div>
                              ))}
                              {filteredContentItems.map(({ traditionId, bookId, traditionTitle, bookTitle, prayer }) => (
                                <div key={`${traditionId}_${bookId}_${prayer.id}`} style={{ ...styles.smallBtn, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: 8, alignItems: 'center', textAlign: 'left' }}>
                                  <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 15, color: '#1f2937' }} onClick={() => { setSelectedTraditionId(traditionId); setSelectedBookId(bookId); setSelectedPrayerId(prayer.id); }}>
                                    <div style={{ fontWeight: 700 }}>[{contentTypeLabel(prayer)}] {prayer.title}</div>
                                    <div style={{ fontSize: 12, color: '#4b5563', marginTop: 3 }}>
                                      {prayerOriginLabel(prayer, bookTitle, traditionTitle)}
                                    </div>
                                  </button>
                                  <button style={styles.smallBtn} onClick={() => { setSelectedTraditionId(traditionId); setSelectedBookId(bookId); setSelectedPrayerId(prayer.id); startEditPrayer(prayer); }}>Edit</button>
                                  <button style={styles.dangerBtn} onClick={() => deletePrayerWithConfirm(traditionId, bookId, prayer)}>Delete</button>
                                </div>
                              ))}
                              {!filteredContentBooks.length && !filteredContentItems.length ? (
                                <div style={styles.infoBox}>No books, prayers, speeches, or sermons match this filter.</div>
                              ) : null}
                            </div>
                          </div>

                          <div style={styles.sectionCard}>
                            <div style={styles.sectionTitle}>Add / edit prayer</div>
                            <input value={editPrayerTitle} onChange={(e) => setEditPrayerTitle(e.target.value)} placeholder="Prayer title" style={{ ...styles.input, marginBottom: 10 }} />
                            <textarea value={editPrayerText} onChange={(e) => setEditPrayerText(e.target.value)} placeholder="Prayer text" rows={5} style={{ ...styles.textarea, marginBottom: 10 }} />
                            <textarea value={editPrayerTranslation} onChange={(e) => setEditPrayerTranslation(e.target.value)} placeholder="Translation (optional)" rows={3} style={{ ...styles.textarea, marginBottom: 10 }} />
                            <div style={styles.buttonRow}>
                              <button style={styles.successBtn} onClick={saveEditedPrayer}>Save prayer</button>
                              <button style={styles.smallBtn} onClick={() => { setEditingPrayerId(""); setEditPrayerTitle(""); setEditPrayerText(""); setEditPrayerTranslation(""); }}>New</button>
                              <button style={styles.smallBtn} onClick={cancelMenuPanel}>Cancel</button>
                            </div>
                          </div>
                        </>
                      )}

                      {activePrayerTool === "speech" && (
                        <div style={{ display: "grid", gap: 12 }}>
                          <div style={styles.sectionCard}>
                            <div style={styles.sectionTitle}>Create new speech</div>
                            <input value={customPrayerTitle} onChange={(e) => setCustomPrayerTitle(e.target.value)} placeholder={datedDefaultName("Speech")} style={{ ...styles.input, marginBottom: 10 }} />
                            <textarea value={customPrayerText} onChange={(e) => setCustomPrayerText(e.target.value)} placeholder="Free text for the speech" rows={6} style={{ ...styles.textarea, marginBottom: 10 }} />
                            <textarea value={customPrayerTranslation} onChange={(e) => setCustomPrayerTranslation(e.target.value)} placeholder="Translation / notes optional" rows={3} style={{ ...styles.textarea, marginBottom: 10 }} />
                            <div style={styles.buttonRow}>
                              <button style={styles.successBtn} onClick={saveSpeech}>Save speech</button>
                              <button style={styles.smallBtn} onClick={() => { setCustomPrayerTitle(""); setCustomPrayerText(""); setCustomPrayerTranslation(""); setActivePrayerTool("list"); }}>Cancel</button>
                            </div>
                          </div>
                          <div style={styles.sectionCard}>
                            <div style={styles.sectionTitle}>Existing speeches</div>
                            <div style={{ display: "grid", gap: 8 }}>
                              {existingSpeeches.length ? existingSpeeches.map(({ traditionId, bookId, traditionTitle, bookTitle, prayer }) => (
                                <div key={`${traditionId}_${bookId}_${prayer.id}`} style={{ ...styles.smallBtn, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: 8, alignItems: 'center', textAlign: 'left' }}>
                                  <div>
                                    <div style={{ fontWeight: 700 }}>{prayer.title}</div>
                                    <div style={{ fontSize: 12, color: '#4b5563', marginTop: 3 }}>{prayerOriginLabel(prayer, bookTitle, traditionTitle)}</div>
                                  </div>
                                  <button style={styles.smallBtn} onClick={() => { setSelectedTraditionId(traditionId); setSelectedBookId(bookId); setSelectedPrayerId(prayer.id); startEditPrayer(prayer); setActivePrayerTool("list"); }}>Edit</button>
                                  <button style={styles.dangerBtn} onClick={() => deletePrayerWithConfirm(traditionId, bookId, prayer)}>Delete</button>
                                </div>
                              )) : <div style={styles.infoBox}>No saved speeches yet.</div>}
                            </div>
                          </div>
                        </div>
                      )}

                      {activePrayerTool === "sermon" && (
                        <div style={styles.sectionCard}>
                          <div style={styles.sectionTitle}>Prepare a sermon</div>
                          <div style={{ ...styles.infoBox, marginBottom: 10 }}>Select from all possibilities: prayers, speeches, and saved combinations.</div>
                          <div style={{ ...styles.sectionCard, marginBottom: 12 }}>
                            <div style={styles.sectionSubTitle}>Existing sermons</div>
                            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                              {existingSermons.length ? existingSermons.map(({ traditionId, bookId, traditionTitle, bookTitle, prayer }) => (
                                <div key={`${traditionId}_${bookId}_${prayer.id}`} style={{ ...styles.smallBtn, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: 8, alignItems: 'center', textAlign: 'left' }}>
                                  <div>
                                    <div style={{ fontWeight: 700 }}>{prayer.title}</div>
                                    <div style={{ fontSize: 12, color: '#4b5563', marginTop: 3 }}>{prayerOriginLabel(prayer, bookTitle, traditionTitle)}</div>
                                  </div>
                                  <button style={styles.smallBtn} onClick={() => { setSelectedTraditionId(traditionId); setSelectedBookId(bookId); setSelectedPrayerId(prayer.id); startEditPrayer(prayer); setActivePrayerTool("list"); }}>Edit</button>
                                  <button style={styles.dangerBtn} onClick={() => deletePrayerWithConfirm(traditionId, bookId, prayer)}>Delete</button>
                                </div>
                              )) : <div style={styles.infoBox}>No saved sermons yet.</div>}
                            </div>
                          </div>
                          <input value={sequenceName} onChange={(e) => setSequenceName(e.target.value)} placeholder={datedDefaultName("Sermon")} style={{ ...styles.input, marginBottom: 12 }} />
                          <div style={{ display: "grid", gap: 8, maxHeight: 240, overflow: "auto", marginBottom: 12 }}>
                            {allLibraryPrayers.map(({ traditionTitle, bookTitle, prayer }) => (
                              <button key={`${traditionTitle}_${bookTitle}_${prayer.id}`} style={styles.smallBtn} onClick={() => addPrayerToSequence(prayer, `${traditionTitle} / ${bookTitle}`)}>
                                {prayer.title} — {bookTitle} / {traditionTitle}
                              </button>
                            ))}
                          </div>
                          {sequenceItems.length ? (
                            <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                              {sequenceItems.map((item, index) => (
                                <div key={item.id} style={styles.seqItem}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                                    <div><strong>{index + 1}. {item.title}</strong><div>{item.sourceLabel}</div></div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                      <button style={styles.smallBtn} onClick={() => moveSequenceItemUp(index)}>{t("master.up")}</button>
                                      <button style={styles.smallBtn} onClick={() => moveSequenceItemDown(index)}>{t("master.down")}</button>
                                      <button style={styles.dangerBtn} onClick={() => removeSequenceItem(item.id)}>{t("master.remove")}</button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : <div style={styles.infoBox}>{t("master.noSequence")}</div>}
                          <div style={{ ...styles.buttonRow, marginTop: 12 }}>
                            <button style={styles.successBtn} onClick={saveCustomSequence}>Save sermon</button>
                            <button style={styles.smallBtn} onClick={clearSequence}>Clear</button>
                            <button style={styles.smallBtn} onClick={() => { clearSequence(); setActivePrayerTool("list"); }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeMenuPanel === "about" && (
                    <div style={styles.sectionCard}>
                      <div style={styles.cardTitleRow}><div style={styles.sectionTitle}>{t("master.about")}</div><button style={styles.smallBtn} onClick={cancelMenuPanel}>Cancel</button></div>
                      <div style={{ lineHeight: 1.7 }}>{t("master.aboutText")}</div>
                    </div>
                  )}

                  {activeMenuPanel === "help" && (
                    <div style={styles.sectionCard}>
                      <div style={styles.cardTitleRow}><div style={styles.sectionTitle}>{t("master.help")}</div><button style={styles.smallBtn} onClick={cancelMenuPanel}>Cancel</button></div>
                      <div style={{ lineHeight: 1.7 }}>{t("master.helpText")}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={styles.layout}>
          <div style={{ ...styles.prayerSection, minHeight: showTranslation ? 'calc(100vh - 460px)' : 'calc(100vh - 190px)' }}>
            <div style={styles.sectionHeaderRow}>
              <div style={styles.controlGrid}>
                <div style={styles.sectionCard}>
                  <div style={styles.cardTitleRow}>
                    <div style={styles.sectionSubTitle}>{t("master.prayerSelection")}</div>
                    <span style={styles.infoIcon} title="Choose the religion, prayer book, and prayer to show on the Master and Follower screens.">i</span>
                  </div>
                  <div style={styles.compactSelectGrid}>
                    {!savedReligionId ? (
                      <select value={selectedTraditionId} onChange={(e) => {
                        const traditionId = e.target.value;
                        const tradition = findTradition(traditions, traditionId);
                        const firstBook = tradition?.books[0] ?? null;
                        const firstPrayer = firstBook?.prayers[0] ?? null;
                        setSelectedTraditionId(traditionId);
                        setSelectedBookId(firstBook?.id ?? '');
                        setSelectedPrayerId(firstPrayer?.id ?? '');
                      }} style={styles.compactSelect} aria-label={t("master.religionTradition")}>
                        <option value="">{t("master.selectReligion")}</option>
                        {traditions.map((tradition) => <option key={tradition.id} value={tradition.id}>{tradition.title}</option>)}
                      </select>
                    ) : null}
                    <select value={selectedBookId} onChange={(e) => {
                      const bookId = e.target.value;
                      const book = findBook(traditions, selectedTraditionId, bookId);
                      setSelectedBookId(bookId);
                      setSelectedPrayerId(book?.prayers[0]?.id ?? '');
                    }} style={styles.compactSelect} disabled={!selectedTradition} aria-label={t("master.prayerBook")}>
                      <option value="">{t("master.selectBook")}</option>
                      {(selectedTradition?.books || []).map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
                    </select>
                    <select value={selectedPrayerId} onChange={(e) => setSelectedPrayerId(e.target.value)} style={styles.compactSelect} disabled={!selectedBook} aria-label={t("master.prayer")}>
                      <option value="">{t("master.selectPrayer")}</option>
                      {(selectedBook?.prayers || []).map((prayer) => <option key={prayer.id} value={prayer.id}>{prayer.title}</option>)}
                    </select>
                  </div>
                  <div style={{ ...styles.buttonRow, marginTop: 8 }}>
                    <button style={styles.primaryBtn} disabled={!sessionCode || !activePrayer} onClick={applySelectedPrayerToSession}>{t("master.loadPrayer")}</button>
                  </div>
                </div>

                <div style={styles.sectionCard}>
                  <div style={styles.cardTitleRow}>
                    <div style={styles.sectionSubTitle}>{t("common.session")}</div>
                    <span style={styles.infoIcon} title="Create a session code for followers, or reset the current prayer back to the first word.">i</span>
                  </div>
                  <div style={styles.buttonRow}>
                    <button style={styles.primaryBtn} onClick={createSession}>{t("master.create")}</button>
                    <button style={styles.primaryBtn} onClick={resetWords}>{t("master.reset")}</button>
                  </div>
                  <div style={{ ...styles.infoBox, marginTop: 8 }}>{t("master.sessionCode")}: {sessionCode || t("master.notCreatedYet")}</div>
                </div>

                <div style={styles.sectionCard}>
                  <div style={styles.cardTitleRow}>
                    <div style={styles.sectionSubTitle}>{t("master.autoPlay")}</div>
                    <span style={styles.infoIcon} title="Automatically advance through the prayer at the selected speed without using the microphone.">i</span>
                  </div>
                  <div style={styles.buttonRow}>
                    <button style={styles.primaryBtn} onClick={() => setIsPlaying(true)}>{t("master.start")}</button>
                    <button style={styles.primaryBtn} onClick={() => setIsPlaying(false)}>{t("master.pause")}</button>
                    <button style={styles.primaryBtn} onClick={resetWords}>{t("master.reset")}</button>
                    <button style={styles.primaryBtn} onClick={() => setSpeedMs((v) => Math.max(300, v - 300))}>+</button>
                    <button style={styles.primaryBtn} onClick={() => setSpeedMs((v) => Math.min(5000, v + 300))}>-</button>
                  </div>
                  <div style={{ ...styles.infoBox, marginTop: 8 }}>{t("master.speed")}: {(speedMs / 1000).toFixed(speedMs % 1000 === 0 ? 0 : 1)}s</div>
                </div>

                <div style={styles.sectionCard}>
                  <div style={styles.cardTitleRow}>
                    <div style={styles.sectionSubTitle}>{t("master.voiceFollow")}</div>
                    <span style={styles.infoIcon} title="Use browser speech recognition to follow your spoken words and move the follower screen automatically.">i</span>
                  </div>
                  <div style={styles.buttonRow}>
                    <button style={styles.primaryBtn} disabled={!speechSupported || !sessionCode} onClick={startVoiceRecognition}>{t("master.start")}</button>
                    <button style={styles.primaryBtn} disabled={!speechSupported} onClick={stopVoiceRecognition}>{t("master.pauseContinue")}</button>
                    <button style={styles.primaryBtn} onClick={() => setStatus('voice search-my-place uses live voice matching after Start')}>{t("master.searchMyPlace")}</button>
                  </div>
                  <div style={{ ...styles.infoBox, marginTop: 8 }}>{t("master.voice")}: {isListening ? t("common.listening") : t("common.stopped")} · Browser</div>
                </div>
              </div>
            </div>

            <h2 style={styles.sectionTitle}>{t("master.prayer")}</h2>
            <div style={styles.prayerMeta}>{t("master.prayer")} :{session?.prayerTitle || activePrayer?.title || t("master.name")}</div>
            {currentSection ? <div style={styles.prayerMeta}>{t("master.section")} :{currentSection.title}</div> : null}
            <div style={styles.prayerMeta}>{t("master.word")} : {words.length ? `${currentIndex + 1} / ${words.length}` : '0 / 0'}</div>
            {canUseVoiceDebug ? (
              <>
                <div style={styles.debugToggleRow}>
                  <button style={styles.smallBtn} onClick={() => setShowVoiceDebug((v) => !v)}>
                    {showVoiceDebug ? t("master.hideVoiceDebug") : t("master.showVoiceDebug")}
                  </button>
                  <span style={styles.prayerMeta}>{t("master.voice")}: {isListening ? t("common.listening") : t("common.stopped")}</span>
                  <span style={styles.prayerMeta}>Engine: Browser</span>
                  <span style={styles.prayerMeta}>{t("master.speechLang")}: {speechLangForPrayer(activePrayer)}</span>
                </div>

                {showVoiceDebug ? (
                  <div style={styles.debugBox}>
                    {JSON.stringify(debugSnapshot, null, 2)}
                  </div>
                ) : null}
              </>
            ) : null}

            <div style={styles.bookSpread}>
              <div style={{ ...styles.bookPage, ...styles.bookPageLeft }}>
                <div style={styles.bookPageTitle}>{t("master.prayer")}</div>
                <div style={{ ...styles.prayerBox, fontSize: prayerFontSize }}>
                  {words.map((w, i) => (
                    <span
                      key={i}
                      onClick={async () => {
                        if (!sessionCode || !session) return;
                        await update(ref(db, `sessions/${sessionCode}`), {
                          currentIndex: i,
                          updatedAt: Date.now(),
                        });
                      }}
                      style={{
                        marginRight: 8,
                        cursor: sessionCode && session ? 'pointer' : 'default',
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: i === currentIndex ? '#111827' : 'transparent',
                        color: i === currentIndex ? 'white' : i < currentIndex ? '#8b7b63' : '#2b2418',
                      }}
                      title={sessionCode && session ? t("master.clickMoveWord") : undefined}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>

              {showTranslation ? (
                <div style={{ ...styles.bookPage, ...styles.bookPageRight }}>
                  <div style={styles.bookPageTitle}>{t("follower.translation")}</div>
                  <div style={styles.translationBox}>
                    {session?.translationEnglish || activePrayer?.translationEnglish || t("common.noTranslation")}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

