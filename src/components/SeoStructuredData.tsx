export default function SeoStructuredData() {
  const data = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Prayer Companion",
  "url": "https://prayer-master.vercel.app",
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web, iOS, Android",
  "description": "Create and lead prayer sessions, prepare sermons, manage a prayer library, and synchronize a leader\u2019s selected prayer with followers on phones, tablets, and TVs.",
  "audience": {
    "@type": "Audience",
    "audienceType": "Prayer leaders, ministries, congregations, and prayer groups"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free trial or free access options may be available; see the current pricing page."
  }
};

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
