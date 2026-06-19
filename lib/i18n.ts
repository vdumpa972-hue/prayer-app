export const SUPPORTED_LANGUAGES = ["en", "es", "he"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";
export const LANGUAGE_STORAGE_KEY = "prayer_companion_preferred_language";
export const LANGUAGE_CHANGED_EVENT = "prayer-companion-language-changed";

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  es: "Español",
  he: "עברית",
};

const DICTIONARY = {
  en: {
    common: {
      language: "Language", signOut: "Sign Out", profile: "Profile", close: "Close", status: "Status", session: "Session", build: "Build",
      loading: "Loading...", yes: "Yes", no: "No", supported: "Supported", stopped: "Stopped", listening: "Listening", textSize: "Text Size",
      enableTranslation: "Enable Translation", disableTranslation: "Disable Translation", noTranslation: "No translation", exit: "Exit",
    },
    roles: { owner: "super-admin", admin: "master", user: "follower", unknown: "user" },
    master: {
      title: "Prayer Master", checkingAccess: "Checking subscription access...", menu: "Menu", toolsMenu: "Tools / Menu",
      help: "Help", hideHelp: "Hide Help", about: "About", hideAbout: "Hide About", settings: "Settings", customPrayer: "Custom Prayer", showTranslation: "Show Translation", searchMyPlace: "Search My Place",
      aboutText: "Shalom Dahan is a retired software engineer with a burning mind. The idea of this app came up while admiring the AI revolution impact on our world and brainstorming ideas that might be needed.",
      helpText: "Main screen is optimized for quick prayer reading. Use the top command strips to create sessions, load the prayer, start voice, and run auto play. Use the larger prayer panel below for reading and clicking words.",
      loadLibraryActions: "Load / Library actions", mergeSampleLibrary: "Merge Sample Library", replaceSampleLibrary: "Replace Sample Library", importJson: "Import JSON", loadJsonFromUrl: "Load JSON from URL",
      loadQuranApi: "Load Quran (API)", loadBibleApi: "Load Bible (API)", loadJewishSefaria: "Load Jewish (Sefaria)",
      prayerSelection: "Prayer selection", religionTradition: "Religion / Tradition", selectReligion: "Select religion", prayerBook: "Prayer Book", selectBook: "Select book", prayer: "Prayer", selectPrayer: "Select prayer", loadPrayer: "Load Prayer",
      selectedReligion: "Selected Religion", selectedBook: "Selected Book", selectedPrayer: "Selected Prayer", source: "Source", sessionCode: "Session Code", notCreatedYet: "Not created yet",
      sequenceCreation: "Sequence creation", addSelectedPrayer: "Add Selected Prayer", addYourOwn: "Add Your Own Custom Prayer", customPrayerTitle: "Custom prayer title", customPrayerText: "Custom prayer text", customPrayerTranslation: "Custom prayer translation (optional)", addCustomPrayer: "Add Custom Prayer", sequenceItems: "Sequence items", noSequence: "No prayers in the sequence yet.", sequenceItem: "Sequence item", up: "Up", down: "Down", remove: "Remove", nameForSequence: "Name for saved sequence", saveSequence: "Save Sequence to DB", clearSequence: "Clear Sequence",
      voiceAdvanced: "Voice advanced", autoNextSection: "Auto-next section when voice reaches the end", liveTranscript: "Live Transcript", nothingHeard: "(nothing heard yet)",
      autoPlay: "AutoPlay", create: "Create", start: "Start", stop: "Stop", pause: "Pause", continue: "Continue", speed: "Speed", voiceFollow: "Voice Follow", pauseContinue: "Pause/Continue", prev: "Prev", next: "Next", reset: "Reset", hideVoiceDebug: "Hide Voice Debug", showVoiceDebug: "Show Voice Debug", voice: "Voice", speechLang: "Speech Lang", section: "Section", word: "Word", name: "name", clickMoveWord: "Click to move current word here",
    },
    follower: {
      title: "Follower", subtitle: "Join a session and follow the current prayer in real time.", enterSessionCode: "Enter session code", join: "Join", currentPrayer: "Current Prayer", wordPosition: "Word Position", joinToShow: "Join a session to show the prayer text.", translation: "Translation",
    },
    superAdmin: {
      badge: "Developer app-owner area", title: "Super Admin", subtitle: "Control area for the app developer / super-admin. Use this page to test master features and manage developer-only app settings.",
      languageTitle: "Language support", languageText: "The selected language is available globally and saved for logged-in users.",
      debugTitle: "Debug trace", debugText: "Controls whether the master page shows the voice debug trace by default on this device.", debugOn: "Debug trace enabled", debugOff: "Debug trace disabled",
      runMaster: "Display Master Window", masterFeatures: "Master Features / Testing", accountManagement: "Account Management", ownerDashboard: "Owner Dashboard", login: "Login", follower: "Follower Window", roleMapTitle: "Current role display map", ownerMap: "owner → super-admin (developer)", adminMap: "admin → master (client)", userMap: "user → follower",
    },
  },
  es: {
    common: {
      language: "Idioma", signOut: "Cerrar sesión", profile: "Perfil", close: "Cerrar", status: "Estado", session: "Sesión", build: "Versión",
      loading: "Cargando...", yes: "Sí", no: "No", supported: "Compatible", stopped: "Detenido", listening: "Escuchando", textSize: "Tamaño del texto",
      enableTranslation: "Activar traducción", disableTranslation: "Desactivar traducción", noTranslation: "Sin traducción", exit: "Salir",
    },
    roles: { owner: "superadministrador", admin: "maestro", user: "seguidor", unknown: "usuario" },
    master: {
      title: "Maestro de oración", checkingAccess: "Verificando acceso de suscripción...", menu: "Menú", toolsMenu: "Herramientas / Menú",
      help: "Ayuda", hideHelp: "Ocultar ayuda", about: "Acerca de", hideAbout: "Ocultar acerca de", settings: "Configuración", customPrayer: "Oración personalizada", showTranslation: "Mostrar traducción", searchMyPlace: "Buscar mi lugar",
      aboutText: "Shalom Dahan es un ingeniero de software retirado con una mente activa. La idea de esta aplicación surgió al admirar el impacto de la revolución de IA en nuestro mundo y pensar en ideas que podrían ser necesarias.",
      helpText: "La pantalla principal está optimizada para lectura rápida de oraciones. Use las barras superiores para crear sesiones, cargar la oración, iniciar voz y ejecutar reproducción automática. Use el panel grande inferior para leer y hacer clic en palabras.",
      loadLibraryActions: "Cargar / acciones de biblioteca", mergeSampleLibrary: "Combinar biblioteca de ejemplo", replaceSampleLibrary: "Reemplazar biblioteca de ejemplo", importJson: "Importar JSON", loadJsonFromUrl: "Cargar JSON desde URL",
      loadQuranApi: "Cargar Corán (API)", loadBibleApi: "Cargar Biblia (API)", loadJewishSefaria: "Cargar textos judíos (Sefaria)",
      prayerSelection: "Selección de oración", religionTradition: "Religión / Tradición", selectReligion: "Seleccionar religión", prayerBook: "Libro de oración", selectBook: "Seleccionar libro", prayer: "Oración", selectPrayer: "Seleccionar oración", loadPrayer: "Cargar oración",
      selectedReligion: "Religión seleccionada", selectedBook: "Libro seleccionado", selectedPrayer: "Oración seleccionada", source: "Fuente", sessionCode: "Código de sesión", notCreatedYet: "Aún no creado",
      sequenceCreation: "Creación de secuencia", addSelectedPrayer: "Agregar oración seleccionada", addYourOwn: "Agregar su propia oración", customPrayerTitle: "Título de oración personalizada", customPrayerText: "Texto de oración personalizada", customPrayerTranslation: "Traducción personalizada (opcional)", addCustomPrayer: "Agregar oración personalizada", sequenceItems: "Elementos de secuencia", noSequence: "Todavía no hay oraciones en la secuencia.", sequenceItem: "Elemento de secuencia", up: "Subir", down: "Bajar", remove: "Eliminar", nameForSequence: "Nombre para la secuencia guardada", saveSequence: "Guardar secuencia en DB", clearSequence: "Limpiar secuencia",
      voiceAdvanced: "Voz avanzada", autoNextSection: "Avanzar sección automáticamente cuando la voz llega al final", liveTranscript: "Transcripción en vivo", nothingHeard: "(aún no se escuchó nada)",
      autoPlay: "Reproducción automática", create: "Crear", start: "Iniciar", stop: "Detener", pause: "Pausa", continue: "Continuar", speed: "Velocidad", voiceFollow: "Seguimiento por voz", pauseContinue: "Pausa/Continuar", prev: "Anterior", next: "Siguiente", reset: "Reiniciar", hideVoiceDebug: "Ocultar depuración de voz", showVoiceDebug: "Mostrar depuración de voz", voice: "Voz", speechLang: "Idioma de voz", section: "Sección", word: "Palabra", name: "nombre", clickMoveWord: "Haga clic para mover la palabra actual aquí",
    },
    follower: {
      title: "Seguidor", subtitle: "Únase a una sesión y siga la oración actual en tiempo real.", enterSessionCode: "Ingrese código de sesión", join: "Unirse", currentPrayer: "Oración actual", wordPosition: "Posición de palabra", joinToShow: "Únase a una sesión para mostrar el texto de la oración.", translation: "Traducción",
    },
    superAdmin: {
      badge: "Área del desarrollador", title: "Superadministrador", subtitle: "Área de control para el desarrollador / superadministrador. Use esta página para probar funciones del maestro y administrar configuraciones internas.",
      languageTitle: "Soporte de idioma", languageText: "El idioma seleccionado está disponible globalmente y se guarda para usuarios conectados.",
      debugTitle: "Trazado de depuración", debugText: "Controla si la página del maestro muestra el trazado de voz por defecto en este dispositivo.", debugOn: "Depuración activada", debugOff: "Depuración desactivada",
      runMaster: "Mostrar ventana del maestro", masterFeatures: "Funciones del maestro / Pruebas", accountManagement: "Administración de cuentas", ownerDashboard: "Panel del propietario", login: "Iniciar sesión", follower: "Ventana del seguidor", roleMapTitle: "Mapa actual de roles", ownerMap: "owner → superadministrador (desarrollador)", adminMap: "admin → maestro (cliente)", userMap: "user → seguidor",
    },
  },
  he: {
    common: {
      language: "שפה", signOut: "התנתק", profile: "פרופיל", close: "סגור", status: "סטטוס", session: "סשן", build: "גרסה",
      loading: "טוען...", yes: "כן", no: "לא", supported: "נתמך", stopped: "עצור", listening: "מקשיב", textSize: "גודל טקסט",
      enableTranslation: "הפעל תרגום", disableTranslation: "כבה תרגום", noTranslation: "אין תרגום", exit: "יציאה",
    },
    roles: { owner: "מנהל-על", admin: "מוביל תפילה", user: "משתתף", unknown: "משתמש" },
    master: {
      title: "מוביל תפילה", checkingAccess: "בודק הרשאת מנוי...", menu: "תפריט", toolsMenu: "כלים / תפריט",
      help: "עזרה", hideHelp: "הסתר עזרה", about: "אודות", hideAbout: "הסתר אודות", settings: "הגדרות", customPrayer: "תפילה מותאמת", showTranslation: "הצג תרגום", searchMyPlace: "מצא את המקום שלי",
      aboutText: "שלום דהן הוא מהנדס תוכנה בדימוס עם מחשבה פעילה. רעיון האפליקציה עלה בזמן התבוננות בהשפעת מהפכת הבינה המלאכותית וחשיבה על רעיונות שייתכן שיהיו נחוצים.",
      helpText: "המסך הראשי מותאם לקריאה מהירה של תפילה. השתמש בפסי הפקודות העליונים ליצירת סשן, טעינת תפילה, הפעלת קול והרצה אוטומטית. השתמש בלוח התפילה הגדול לקריאה וללחיצה על מילים.",
      loadLibraryActions: "טעינה / פעולות ספרייה", mergeSampleLibrary: "מזג ספריית דוגמה", replaceSampleLibrary: "החלף ספריית דוגמה", importJson: "ייבא JSON", loadJsonFromUrl: "טען JSON מכתובת",
      loadQuranApi: "טען קוראן (API)", loadBibleApi: "טען תנ״ך/ברית חדשה (API)", loadJewishSefaria: "טען טקסטים יהודיים (Sefaria)",
      prayerSelection: "בחירת תפילה", religionTradition: "דת / מסורת", selectReligion: "בחר דת", prayerBook: "ספר תפילה", selectBook: "בחר ספר", prayer: "תפילה", selectPrayer: "בחר תפילה", loadPrayer: "טען תפילה",
      selectedReligion: "דת נבחרת", selectedBook: "ספר נבחר", selectedPrayer: "תפילה נבחרת", source: "מקור", sessionCode: "קוד סשן", notCreatedYet: "עדיין לא נוצר",
      sequenceCreation: "יצירת רצף", addSelectedPrayer: "הוסף תפילה נבחרת", addYourOwn: "הוסף תפילה משלך", customPrayerTitle: "כותרת תפילה מותאמת", customPrayerText: "טקסט תפילה מותאם", customPrayerTranslation: "תרגום תפילה מותאם (אופציונלי)", addCustomPrayer: "הוסף תפילה מותאמת", sequenceItems: "פריטי רצף", noSequence: "עדיין אין תפילות ברצף.", sequenceItem: "פריט רצף", up: "למעלה", down: "למטה", remove: "הסר", nameForSequence: "שם לרצף שמור", saveSequence: "שמור רצף למסד נתונים", clearSequence: "נקה רצף",
      voiceAdvanced: "קול מתקדם", autoNextSection: "עבור אוטומטית לסעיף הבא כשהקול מגיע לסוף", liveTranscript: "תמלול חי", nothingHeard: "(עדיין לא נשמע כלום)",
      autoPlay: "הרצה אוטומטית", create: "צור", start: "התחל", stop: "עצור", pause: "השהה", continue: "המשך", speed: "מהירות", voiceFollow: "מעקב קולי", pauseContinue: "השהה/המשך", prev: "קודם", next: "הבא", reset: "איפוס", hideVoiceDebug: "הסתר דיבוג קול", showVoiceDebug: "הצג דיבוג קול", voice: "קול", speechLang: "שפת דיבור", section: "סעיף", word: "מילה", name: "שם", clickMoveWord: "לחץ כדי להעביר את המילה הנוכחית לכאן",
    },
    follower: {
      title: "משתתף", subtitle: "הצטרף לסשן ועקוב אחרי התפילה בזמן אמת.", enterSessionCode: "הזן קוד סשן", join: "הצטרף", currentPrayer: "תפילה נוכחית", wordPosition: "מיקום מילה", joinToShow: "הצטרף לסשן כדי להציג את טקסט התפילה.", translation: "תרגום",
    },
    superAdmin: {
      badge: "אזור מפתח", title: "מנהל-על", subtitle: "אזור שליטה למפתח / מנהל-על. ניתן להשתמש בעמוד הזה כדי לבדוק את חלון המוביל ולנהל הגדרות פנימיות.",
      languageTitle: "תמיכה בשפות", languageText: "השפה הנבחרת זמינה בכל האפליקציה ונשמרת למשתמשים מחוברים.",
      debugTitle: "מעקב דיבוג", debugText: "קובע האם חלון המוביל יציג מעקב קול כברירת מחדל במכשיר הזה.", debugOn: "דיבוג פעיל", debugOff: "דיבוג כבוי",
      runMaster: "הצג חלון מוביל", masterFeatures: "תכונות מוביל / בדיקות", accountManagement: "ניהול חשבונות", ownerDashboard: "לוח בעלים", login: "כניסה", follower: "חלון משתתף", roleMapTitle: "מפת תצוגת תפקידים", ownerMap: "owner → מנהל-על (מפתח)", adminMap: "admin → מוביל תפילה (לקוח)", userMap: "user → משתתף",
    },
  },
} as const;

export function normalizeLanguage(value: string | null | undefined): SupportedLanguage {
  const normalized = String(value || "").trim().toLowerCase();
  return SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage) ? (normalized as SupportedLanguage) : DEFAULT_LANGUAGE;
}

export function getStoredLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
}

export function persistLanguage(language: SupportedLanguage) {
  if (typeof window === "undefined") return;
  const normalized = normalizeLanguage(language);
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGED_EVENT, { detail: normalized }));
}

export function getLanguageLabel(language: SupportedLanguage) {
  return LANGUAGE_LABELS[normalizeLanguage(language)];
}

export function translate(language: SupportedLanguage, key: string): string {
  const normalized = normalizeLanguage(language);
  const parts = key.split(".");
  let current: unknown = DICTIONARY[normalized];
  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      current = DICTIONARY.en;
      for (const fallbackPart of parts) {
        if (!current || typeof current !== "object" || !(fallbackPart in current)) return key;
        current = (current as Record<string, unknown>)[fallbackPart];
      }
      break;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : key;
}

export function getDisplayRole(role: string | null | undefined, language: SupportedLanguage = DEFAULT_LANGUAGE): string {
  const normalizedRole = role === "owner" || role === "admin" || role === "user" ? role : "unknown";
  return translate(language, `roles.${normalizedRole}`);
}
