'use client';

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

const GUEST_DEMO_EMAIL = "vdumpa972+guest1@gmail.com";
const GUEST_DEMO_PASSWORD = "123456";

type LandingCopy = {
  navAbout: string;
  navBenefits: string;
  navHow: string;
  navHelp: string;
  navPricing: string;
  badge: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  loginCta: string;
  followerCta: string;
  ownerCta: string;
  trustOne: string;
  trustTwo: string;
  trustThree: string;
  benefitTitle: string;
  benefitIntro: string;
  benefitOneTitle: string;
  benefitOneText: string;
  benefitTwoTitle: string;
  benefitTwoText: string;
  benefitThreeTitle: string;
  benefitThreeText: string;
  benefitFourTitle: string;
  benefitFourText: string;
  aboutTitle: string;
  aboutText: string;
  whoTitle: string;
  whoOne: string;
  whoTwo: string;
  whoThree: string;
  howTitle: string;
  howOneTitle: string;
  howOneText: string;
  howTwoTitle: string;
  howTwoText: string;
  howThreeTitle: string;
  howThreeText: string;
  trialTitle: string;
  trialText: string;
  monthlyTitle: string;
  monthlyText: string;
  annualTitle: string;
  annualText: string;
  helpTitle: string;
  helpOne: string;
  helpTwo: string;
  helpThree: string;
  howToTitle: string;
  howToMasterTitle: string;
  howToMasterOne: string;
  howToMasterTwo: string;
  howToMasterThree: string;
  howToFollowerTitle: string;
  howToFollowerOne: string;
  howToFollowerTwo: string;
  howToFollowerThree: string;
  howToTipsTitle: string;
  howToTipsOne: string;
  howToTipsTwo: string;
  howToTipsThree: string;
  footerTitle: string;
  footerText: string;
};

const COPY: Record<string, LandingCopy> = {
  en: {
    navAbout: "About",
    navBenefits: "Benefits",
    navHow: "How it works",
    navHelp: "Help",
    navPricing: "Trial & pricing",
    badge: "Prayer Companion",
    title: "Lead group prayer from one master screen.",
    subtitle:
      "Create a session, load a prayer, and let followers join from their own devices so everyone stays in the same place without passing books around or losing the current line.",
    primaryCta: "Start 30-Day Trial",
    loginCta: "Login",
    followerCta: "Join a Session",
    ownerCta: "Guest Demo",
    trustOne: "Followers join without purchasing a plan.",
    trustTwo: "Works across phones, tablets, and computers.",
    trustThree: "The master controls the shared reading position.",
    benefitTitle: "Why this helps",
    benefitIntro:
      "Prayer Companion is built for families, study groups, small congregations, classes, and anyone leading shared reading or prayer.",
    benefitOneTitle: "Less dependence on printed books",
    benefitOneText:
      "The master can load the prayer once, and everyone follows on their own phone or tablet. This reduces the need to buy, carry, pass, or search through multiple prayer books.",
    benefitTwoTitle: "Everyone stays together",
    benefitTwoText:
      "Followers see the same prayer position as the master. The leader can move word by word, reset, pause, or use auto play.",
    benefitThreeTitle: "Useful for mixed-language groups",
    benefitThreeText:
      "Keep the original prayer visible and optionally show an English translation. The app shell also supports language switching for the user interface.",
    benefitFourTitle: "Flexible for many traditions",
    benefitFourText:
      "Use sample prayers, load prayer libraries, bring in custom prayers, or build a sequence for a service, class, or family event.",
    aboutTitle: "About the app",
    aboutText:
      "Prayer Companion is a simple master-and-follower prayer system. The master selects the text and controls the pace. Followers join by session code and follow along in real time.",
    whoTitle: "Good for",
    whoOne: "A family member leading prayer at home.",
    whoTwo: "A teacher, rabbi, priest, minister, imam, or group leader guiding a room.",
    whoThree: "Small groups where people use different devices and may need translation support.",
    howTitle: "How it works",
    howOneTitle: "1. Master creates a session",
    howOneText:
      "The leader chooses a prayer, creates a session code, and controls the reading from the master screen.",
    howTwoTitle: "2. Followers join",
    howTwoText:
      "Followers open the join page, enter the session code, and immediately see the active prayer.",
    howThreeTitle: "3. The group follows together",
    howThreeText:
      "The master advances words manually, uses auto play, or tests voice-follow tools where supported by the browser.",
    trialTitle: "30-day trial",
    trialText:
      "New master accounts can start with a trial before choosing a paid plan. This is the best way to test the app with real users.",
    monthlyTitle: "Monthly plan",
    monthlyText:
      "Use month to month when you want flexibility or are testing with a new group.",
    annualTitle: "Annual plan",
    annualText:
      "Use annual billing when the app becomes part of a regular prayer, class, or group routine.",
    helpTitle: "Help and common questions",
    helpOne: "Master users create and control sessions. Followers only need the session code.",
    helpTwo: "A follower does not need to buy the app just to join a session.",
    helpThree:
      "For best voice-follow testing, use a supported desktop browser and keep the room as quiet as possible.",
    howToTitle: "How-to guide",
    howToMasterTitle: "For the master",
    howToMasterOne: "Log in, open the master page, choose the tradition, prayer book, and prayer you want to lead.",
    howToMasterTwo: "Create a session, share the code with followers, then use Next, Back, Reset, Pause, or Auto Play to control the pace.",
    howToMasterThree: "Use Settings to show or hide translation, adjust font size, select defaults, and test voice-follow tools when your browser supports speech recognition.",
    howToFollowerTitle: "For followers",
    howToFollowerOne: "Open the follower link on a phone, tablet, or computer and enter the session code from the master.",
    howToFollowerTwo: "Keep the page open during the prayer. The current word and prayer position update as the master moves through the text.",
    howToFollowerThree: "Use the translation window when available, and refresh or re-enter the code if the connection is lost.",
    howToTipsTitle: "Common operations",
    howToTipsOne: "Load a prayer library when you want ready-made texts, or add a custom prayer when the group needs a special text.",
    howToTipsTwo: "Build a sequence when a service or class uses several prayers in a fixed order.",
    howToTipsThree: "Use the join-session page as the link you send to guests; they do not need a paid account just to follow.",
    footerTitle: "Ready to try it?",
    footerText:
      "Start a trial, log in to an existing master account, or send followers directly to the join page.",
  },
  es: {
    navAbout: "Acerca de",
    navBenefits: "Beneficios",
    navHow: "Cómo funciona",
    navHelp: "Ayuda",
    navPricing: "Prueba y precio",
    badge: "Prayer Companion",
    title: "Dirija una oración grupal desde una pantalla principal.",
    subtitle:
      "Cree una sesión, cargue una oración y permita que los seguidores se unan desde sus propios dispositivos para que todos sigan en el mismo lugar.",
    primaryCta: "Comenzar prueba de 30 días",
    loginCta: "Iniciar sesión",
    followerCta: "Unirse a una sesión",
    ownerCta: "Guest Demo",
    trustOne: "Los seguidores se unen sin comprar un plan.",
    trustTwo: "Funciona en teléfonos, tabletas y computadoras.",
    trustThree: "El líder controla la posición compartida de lectura.",
    benefitTitle: "Por qué ayuda",
    benefitIntro:
      "Prayer Companion sirve para familias, grupos de estudio, congregaciones pequeñas, clases y lectura compartida.",
    benefitOneTitle: "Menos dependencia de libros impresos",
    benefitOneText:
      "El líder carga la oración una vez y todos la siguen en su propio teléfono o tableta.",
    benefitTwoTitle: "Todos siguen juntos",
    benefitTwoText:
      "Los seguidores ven la misma posición de la oración que controla el líder.",
    benefitThreeTitle: "Útil para grupos con varios idiomas",
    benefitThreeText:
      "Puede mostrar el texto original y una traducción al inglés. La interfaz también admite cambio de idioma.",
    benefitFourTitle: "Flexible para muchas tradiciones",
    benefitFourText:
      "Use oraciones de ejemplo, bibliotecas, oraciones personalizadas o secuencias.",
    aboutTitle: "Acerca de la app",
    aboutText:
      "Prayer Companion es un sistema simple de líder y seguidores para oración o lectura compartida en tiempo real.",
    whoTitle: "Ideal para",
    whoOne: "Una familia orando en casa.",
    whoTwo: "Un maestro o líder guiando a un grupo.",
    whoThree: "Grupos pequeños que usan dispositivos distintos y necesitan traducción.",
    howTitle: "Cómo funciona",
    howOneTitle: "1. El líder crea una sesión",
    howOneText: "El líder elige una oración, crea un código y controla la lectura.",
    howTwoTitle: "2. Los seguidores se unen",
    howTwoText: "Los seguidores abren la página de unión e ingresan el código.",
    howThreeTitle: "3. El grupo sigue junto",
    howThreeText: "El líder avanza manualmente, usa reproducción automática o herramientas de voz.",
    trialTitle: "Prueba de 30 días",
    trialText: "Las cuentas nuevas pueden probar la app antes de elegir un plan pagado.",
    monthlyTitle: "Plan mensual",
    monthlyText: "Bueno para flexibilidad o pruebas con un grupo nuevo.",
    annualTitle: "Plan anual",
    annualText: "Bueno cuando la app se vuelve parte de una rutina regular.",
    helpTitle: "Ayuda y preguntas comunes",
    helpOne: "El líder crea y controla sesiones. Los seguidores solo necesitan el código.",
    helpTwo: "Un seguidor no necesita comprar la app para unirse a una sesión.",
    helpThree: "Para pruebas de voz, use un navegador compatible y un lugar silencioso.",
    howToTitle: "Guía de uso",
    howToMasterTitle: "Para el líder",
    howToMasterOne: "Inicie sesión, abra la página del líder y elija la tradición, el libro y la oración.",
    howToMasterTwo: "Cree una sesión, comparta el código con los seguidores y use Siguiente, Atrás, Reiniciar, Pausa o reproducción automática para controlar el ritmo.",
    howToMasterThree: "Use Configuración para mostrar u ocultar la traducción, ajustar el tamaño del texto, elegir valores predeterminados y probar seguimiento por voz cuando el navegador lo permita.",
    howToFollowerTitle: "Para seguidores",
    howToFollowerOne: "Abra el enlace de seguidores en teléfono, tableta o computadora e ingrese el código de sesión.",
    howToFollowerTwo: "Mantenga la página abierta durante la oración. La posición se actualiza cuando el líder avanza.",
    howToFollowerThree: "Use la traducción cuando esté disponible, y actualice o vuelva a ingresar el código si se pierde la conexión.",
    howToTipsTitle: "Operaciones comunes",
    howToTipsOne: "Cargue una biblioteca de oraciones para textos preparados, o agregue una oración personalizada para un texto especial.",
    howToTipsTwo: "Cree una secuencia cuando un servicio o clase usa varias oraciones en orden fijo.",
    howToTipsThree: "Use la página de unión como el enlace para invitados; no necesitan una cuenta pagada para seguir.",
    footerTitle: "¿Listo para probar?",
    footerText: "Comience una prueba, inicie sesión o envíe seguidores a la página de unión.",
  },
  he: {
    navAbout: "אודות",
    navBenefits: "יתרונות",
    navHow: "איך זה עובד",
    navHelp: "עזרה",
    navPricing: "ניסיון ותשלום",
    badge: "Prayer Companion",
    title: "הובלת תפילה קבוצתית ממסך מוביל אחד.",
    subtitle:
      "צור סשן, טען תפילה, ותן למשתתפים להצטרף מהמכשירים שלהם כדי שכולם יישארו באותו מקום בלי לחפש בספרים.",
    primaryCta: "התחל ניסיון ל-30 יום",
    loginCta: "כניסה",
    followerCta: "הצטרף לסשן",
    ownerCta: "Guest Demo",
    trustOne: "משתתפים מצטרפים בלי לרכוש תוכנית.",
    trustTwo: "עובד בטלפונים, טאבלטים ומחשבים.",
    trustThree: "המוביל שולט במיקום הקריאה המשותף.",
    benefitTitle: "למה זה עוזר",
    benefitIntro:
      "Prayer Companion מתאים למשפחות, קבוצות לימוד, קהילות קטנות, שיעורים ותפילה או קריאה משותפת.",
    benefitOneTitle: "פחות תלות בספרים מודפסים",
    benefitOneText:
      "המוביל טוען את התפילה פעם אחת וכל המשתתפים עוקבים מהטלפון או הטאבלט שלהם.",
    benefitTwoTitle: "כולם נשארים יחד",
    benefitTwoText: "המשתתפים רואים את אותו מיקום בתפילה שהמוביל שולט בו.",
    benefitThreeTitle: "טוב לקבוצות עם כמה שפות",
    benefitThreeText: "אפשר להציג טקסט מקור ותרגום לאנגלית, וגם להחליף שפת ממשק.",
    benefitFourTitle: "גמיש למסורות שונות",
    benefitFourText: "השתמש בתפילות לדוגמה, ספריות, תפילות מותאמות או רצפים.",
    aboutTitle: "אודות האפליקציה",
    aboutText:
      "Prayer Companion הוא מערכת פשוטה של מוביל ומשתתפים לתפילה או קריאה משותפת בזמן אמת.",
    whoTitle: "מתאים עבור",
    whoOne: "משפחה שמתפללת בבית.",
    whoTwo: "מורה או מוביל שמדריך קבוצה.",
    whoThree: "קבוצות קטנות שמשתמשות במכשירים שונים וזקוקות לתרגום.",
    howTitle: "איך זה עובד",
    howOneTitle: "1. המוביל יוצר סשן",
    howOneText: "המוביל בוחר תפילה, יוצר קוד ושולט בקריאה.",
    howTwoTitle: "2. המשתתפים מצטרפים",
    howTwoText: "המשתתפים פותחים את עמוד ההצטרפות ומזינים את הקוד.",
    howThreeTitle: "3. הקבוצה עוקבת יחד",
    howThreeText: "המוביל מתקדם ידנית, משתמש בהרצה אוטומטית או בכלי מעקב קולי.",
    trialTitle: "ניסיון ל-30 יום",
    trialText: "חשבונות מוביל חדשים יכולים לבדוק את האפליקציה לפני בחירת תוכנית בתשלום.",
    monthlyTitle: "תוכנית חודשית",
    monthlyText: "מתאים לגמישות או בדיקה עם קבוצה חדשה.",
    annualTitle: "תוכנית שנתית",
    annualText: "מתאים כשהאפליקציה הופכת לחלק משגרה קבועה.",
    helpTitle: "עזרה ושאלות נפוצות",
    helpOne: "המוביל יוצר ושולט בסשנים. המשתתפים צריכים רק את הקוד.",
    helpTwo: "משתתף לא צריך לקנות את האפליקציה כדי להצטרף לסשן.",
    helpThree: "לבדיקת מעקב קולי עדיף להשתמש בדפדפן נתמך ובחדר שקט.",
    howToTitle: "מדריך שימוש",
    howToMasterTitle: "למוביל",
    howToMasterOne: "התחבר, פתח את עמוד המוביל, ובחר מסורת, ספר תפילה ותפילה להובלה.",
    howToMasterTwo: "צור סשן, שתף את הקוד עם המשתתפים, והשתמש בהבא, חזרה, איפוס, השהיה או הרצה אוטומטית כדי לשלוט בקצב.",
    howToMasterThree: "השתמש בהגדרות כדי להציג או להסתיר תרגום, לשנות גודל טקסט, לבחור ברירות מחדל ולבדוק מעקב קולי כשהדפדפן תומך בכך.",
    howToFollowerTitle: "למשתתפים",
    howToFollowerOne: "פתח את קישור ההצטרפות בטלפון, טאבלט או מחשב והזן את קוד הסשן מהמוביל.",
    howToFollowerTwo: "השאר את העמוד פתוח בזמן התפילה. המיקום מתעדכן כשהמוביל מתקדם בטקסט.",
    howToFollowerThree: "השתמש בחלון התרגום כשקיים, ורענן או הזן שוב את הקוד אם החיבור אבד.",
    howToTipsTitle: "פעולות נפוצות",
    howToTipsOne: "טען ספריית תפילות לטקסטים מוכנים, או הוסף תפילה מותאמת לטקסט מיוחד.",
    howToTipsTwo: "בנה רצף כאשר שיעור או תפילה כוללים כמה תפילות בסדר קבוע.",
    howToTipsThree: "השתמש בעמוד ההצטרפות כקישור לאורחים; הם לא צריכים חשבון בתשלום כדי לעקוב.",
    footerTitle: "מוכן לנסות?",
    footerText: "התחל ניסיון, התחבר לחשבון קיים, או שלח משתתפים לעמוד ההצטרפות.",
  },
};

export default function PublicLandingPage() {
  const { language } = useLanguage();
  const copy = COPY[language] || COPY.en;
  const isRtl = language === "he";
  function openGuestDemo() {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("prayer_demo_email", GUEST_DEMO_EMAIL);
      window.sessionStorage.setItem("prayer_demo_password", GUEST_DEMO_PASSWORD);
      window.location.href = "/auth?forceLogin=1&demo=guest";
    }
  }

  return (
    <main
      className="prayer-landing"
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        minHeight: "calc(100vh - 48px)",
        padding: "28px 18px 44px",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#111827",
      }}
    >
      <section className="prayer-landing-shell" style={shellStyle}>
        <nav style={navStyle} aria-label="Landing page sections">
          <a href="#about" style={navLinkStyle}>{copy.navAbout}</a>
          <a href="#benefits" style={navLinkStyle}>{copy.navBenefits}</a>
          <a href="#how" style={navLinkStyle}>{copy.navHow}</a>
          <a href="#pricing" style={navLinkStyle}>{copy.navPricing}</a>
          <a href="#help" style={navLinkStyle}>{copy.navHelp}</a>
        </nav>

        <div className="prayer-hero-grid" style={heroGridStyle}>
          <div>
            <div style={badgeStyle}>{copy.badge}</div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 66px)", lineHeight: 1.04, margin: "0 0 16px" }}>
              {copy.title}
            </h1>
            <p style={{ fontSize: 21, lineHeight: 1.55, maxWidth: 850, color: "#374151", margin: "0 0 26px" }}>
              {copy.subtitle}
            </p>
            <div className="prayer-action-row" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
              <Link href="/trial?fresh=1" style={primaryLinkStyle}>{copy.primaryCta}</Link>
              <Link href="/auth?forceLogin=1" style={secondaryLinkStyle}>{copy.loginCta}</Link>
              <button type="button" onClick={openGuestDemo} style={secondaryButtonStyle}>
                {copy.ownerCta}
              </button>
              <Link href="/follower" style={secondaryLinkStyle}>{copy.followerCta}</Link>
            </div>
          </div>

          <div style={summaryBoxStyle}>
            <strong>{copy.whoTitle}</strong>
            <p style={summaryLineStyle}>{copy.whoOne}</p>
            <p style={summaryLineStyle}>{copy.whoTwo}</p>
            <p style={summaryLineStyle}>{copy.whoThree}</p>
          </div>
        </div>

        <div className="prayer-trust-strip" aria-label="Prayer Companion key facts">
          <span>{copy.trustOne}</span>
          <span>{copy.trustTwo}</span>
          <span>{copy.trustThree}</span>
        </div>

        <section id="about" style={sectionBlockStyle}>
          <h2 style={sectionTitleStyle}>{copy.aboutTitle}</h2>
          <p style={largeTextStyle}>{copy.aboutText}</p>
        </section>

        <section id="benefits" style={sectionBlockStyle}>
          <h2 style={sectionTitleStyle}>{copy.benefitTitle}</h2>
          <p style={largeTextStyle}>{copy.benefitIntro}</p>
          <div style={cardGridStyle}>
            <InfoCard title={copy.benefitOneTitle} text={copy.benefitOneText} />
            <InfoCard title={copy.benefitTwoTitle} text={copy.benefitTwoText} />
            <InfoCard title={copy.benefitThreeTitle} text={copy.benefitThreeText} />
            <InfoCard title={copy.benefitFourTitle} text={copy.benefitFourText} />
          </div>
        </section>

        <section id="how" style={sectionBlockStyle}>
          <h2 style={sectionTitleStyle}>{copy.howTitle}</h2>
          <div style={cardGridStyle}>
            <InfoCard title={copy.howOneTitle} text={copy.howOneText} />
            <InfoCard title={copy.howTwoTitle} text={copy.howTwoText} />
            <InfoCard title={copy.howThreeTitle} text={copy.howThreeText} />
          </div>
        </section>

        <section id="pricing" style={sectionBlockStyle}>
          <h2 style={sectionTitleStyle}>{copy.navPricing}</h2>
          <div style={cardGridStyle}>
            <InfoCard title={copy.trialTitle} text={copy.trialText} />
            <InfoCard title={copy.monthlyTitle} text={copy.monthlyText} />
            <InfoCard title={copy.annualTitle} text={copy.annualText} />
          </div>
        </section>

        <section id="help" style={sectionBlockStyle}>
          <h2 style={sectionTitleStyle}>{copy.helpTitle}</h2>
          <div style={cardGridStyle}>
            <InfoCard title={copy.navHelp} text={copy.helpOne} />
            <InfoCard title={copy.followerCta} text={copy.helpTwo} />
            <InfoCard title={copy.navHow} text={copy.helpThree} />
          </div>
        </section>

        <section id="how-to" style={sectionBlockStyle}>
          <h2 style={sectionTitleStyle}>{copy.howToTitle}</h2>
          <div style={cardGridStyle}>
            <InfoCard
              title={copy.howToMasterTitle}
              text={`${copy.howToMasterOne} ${copy.howToMasterTwo} ${copy.howToMasterThree}`}
            />
            <InfoCard
              title={copy.howToFollowerTitle}
              text={`${copy.howToFollowerOne} ${copy.howToFollowerTwo} ${copy.howToFollowerThree}`}
            />
            <InfoCard
              title={copy.howToTipsTitle}
              text={`${copy.howToTipsOne} ${copy.howToTipsTwo} ${copy.howToTipsThree}`}
            />
          </div>
        </section>

        <section style={footerCtaStyle}>
          <h2 style={{ margin: "0 0 10px", fontSize: 30 }}>{copy.footerTitle}</h2>
          <p style={{ margin: "0 0 18px", fontSize: 18, color: "#374151", lineHeight: 1.45 }}>{copy.footerText}</p>
          <div className="prayer-action-row" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/trial?fresh=1" style={primaryLinkStyle}>{copy.primaryCta}</Link>
            <Link href="/auth?forceLogin=1" style={secondaryLinkStyle}>{copy.loginCta}</Link>
            <Link href="/follower" style={secondaryLinkStyle}>{copy.followerCta}</Link>
          </div>
          <div style={policyLinksStyle}>
            <Link href="/privacy" style={policyLinkStyle}>Privacy Policy</Link>
            <Link href="/support" style={policyLinkStyle}>Support</Link>
            <Link href="/terms" style={policyLinkStyle}>Terms of Service</Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <article style={infoCardStyle}>
      <h3 style={{ margin: "0 0 10px", fontSize: 22 }}>{title}</h3>
      <p style={{ margin: 0, lineHeight: 1.5, color: "#374151", fontSize: 16 }}>{text}</p>
    </article>
  );
}

const shellStyle = {
  maxWidth: 1160,
  margin: "0 auto",
  padding: "28px",
} as const;

const navStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "center",
  marginBottom: 30,
} as const;

const navLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 38,
  padding: "0 14px",
  borderRadius: 999,
  background: "rgba(248, 250, 252, 0.86)",
  border: "1px solid #cbd5e1",
  color: "#111827",
  textDecoration: "none",
  fontWeight: 700,
} as const;

const heroGridStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 0.85fr)",
  gap: 22,
  alignItems: "center",
} as const;

const badgeStyle = {
  display: "inline-flex",
  border: "1px solid rgba(203, 184, 148, 0.95)",
  borderRadius: 999,
  padding: "7px 12px",
  background: "rgba(247, 243, 232, 0.86)",
  fontWeight: 700,
  marginBottom: 18,
} as const;

const summaryBoxStyle = {
  background: "rgba(255, 253, 248, 0.86)",
  border: "1px solid rgba(216, 201, 174, 0.95)",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  fontSize: 18,
} as const;

const summaryLineStyle = {
  margin: "12px 0 0",
  lineHeight: 1.45,
  color: "#374151",
} as const;

const sectionBlockStyle = {
  marginTop: 34,
  paddingTop: 8,
} as const;

const sectionTitleStyle = {
  margin: "0 0 12px",
  fontSize: 32,
} as const;

const largeTextStyle = {
  margin: "0 0 18px",
  fontSize: 18,
  color: "#374151",
  lineHeight: 1.55,
  maxWidth: 920,
} as const;

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))",
  gap: 16,
} as const;

const infoCardStyle = {
  background: "rgba(255, 253, 248, 0.86)",
  border: "1px solid rgba(216, 201, 174, 0.95)",
  borderRadius: 16,
  padding: 18,
  minHeight: 150,
} as const;

const footerCtaStyle = {
  marginTop: 36,
  padding: 22,
  borderRadius: 18,
  background: "rgba(247, 243, 232, 0.86)",
  border: "1px solid rgba(203, 184, 148, 0.95)",
} as const;


const policyLinksStyle = {
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
  marginTop: 18,
  paddingTop: 16,
  borderTop: "1px solid rgba(203, 184, 148, 0.8)",
} as const;

const policyLinkStyle = {
  color: "#1d4ed8",
  fontWeight: 700,
  textDecoration: "underline",
} as const;

const primaryLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  padding: "0 20px",
  borderRadius: 12,
  background: "#111827",
  color: "white",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 17,
} as const;

const secondaryLinkStyle = {
  ...primaryLinkStyle,
  background: "rgba(248, 250, 252, 0.86)",
  color: "#111827",
  border: "1px solid #cbd5e1",
} as const;

const secondaryButtonStyle = {
  ...secondaryLinkStyle,
  cursor: "pointer",
  font: "inherit",
} as const;

