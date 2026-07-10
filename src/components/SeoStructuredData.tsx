export default function SeoStructuredData() {
  const data = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://prayer-master.vercel.app/#website",
      "url": "https://prayer-master.vercel.app",
      "name": "Prayer Companion",
      "description": "Create and lead prayer sessions, prepare sermons, manage a prayer library, and synchronize a leader’s selected prayer with followers on phones, tablets, and TVs.",
      "inLanguage": "en-US"
    },
    {
      "@type": "Organization",
      "@id": "https://prayer-master.vercel.app/#organization",
      "name": "Prayer Companion",
      "url": "https://prayer-master.vercel.app"
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://prayer-master.vercel.app/#software",
      "name": "Prayer Companion",
      "url": "https://prayer-master.vercel.app",
      "applicationCategory": "LifestyleApplication",
      "operatingSystem": "Web, iOS, Android",
      "description": "Create and lead prayer sessions, prepare sermons, manage a prayer library, and synchronize a leader’s selected prayer with followers on phones, tablets, and TVs.",
      "featureList": [
        "Live leader and follower sessions",
        "Prayer library",
        "Sermon preparation",
        "Session codes",
        "Translation support",
        "Phone, tablet, TV, and web access"
      ],
      "audience": {
        "@type": "Audience",
        "audienceType": "Prayer leaders, ministries, congregations, families, and prayer groups"
      },
      "publisher": {
        "@id": "https://prayer-master.vercel.app/#organization"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Free trial, guest demo, or free access options may be available; see the current website for plan details."
      }
    },
    {
      "@type": "FAQPage",
      "@id": "https://prayer-master.vercel.app/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does Prayer Companion work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A leader creates a session and shares a code. Followers join from their own devices and stay synchronized with the leader’s place in the prayer."
          }
        },
        {
          "@type": "Question",
          "name": "Do followers need a paid account?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Followers can join a shared session with the session code without purchasing a leader plan."
          }
        },
        {
          "@type": "Question",
          "name": "Who can use Prayer Companion?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Families, teachers, prayer groups, congregations, and ministries can use it for guided prayer or shared reading."
          }
        }
      ]
    }
  ]
};

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
