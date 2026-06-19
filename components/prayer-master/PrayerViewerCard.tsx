type PrayerViewerCardProps = {
  styles: typeof import('./styles').styles;
  session: any;
  activePrayer: any;
  currentSection: { title: string } | null;
  currentIndex: number;
  words: string[];
};

export default function PrayerViewerCard({ styles, session, activePrayer, currentSection, currentIndex, words }: PrayerViewerCardProps) {
  return (
    <div style={styles.card}>
      <div style={styles.sectionTitle}>Prayer Viewer</div>
      <div style={{ marginBottom: 10, fontSize: 18 }}><strong>Current Prayer:</strong> {session?.prayerTitle || activePrayer?.title || '-'}</div>
      {currentSection ? <div style={{ marginBottom: 10, fontSize: 18 }}><strong>Current Section:</strong> {currentSection.title}</div> : null}
      <div style={{ marginBottom: 16, fontSize: 18 }}><strong>Word Position:</strong> {words.length ? `${currentIndex + 1} / ${words.length}` : '0 / 0'}</div>

      <div style={styles.prayerViewer}>
        {words.map((w, i) => (
          <span key={i} style={{
            marginRight: 8,
            padding: '2px 6px',
            borderRadius: 4,
            background: i === currentIndex ? '#111827' : 'transparent',
            color: i === currentIndex ? 'white' : i < currentIndex ? '#94a3b8' : '#111827',
          }}>{w}</span>
        ))}
      </div>

      <div style={{ ...styles.infoBox, marginTop: 16 }}>
        <div style={styles.smallTitle}>English Translation</div>
        <div style={{ whiteSpace: 'pre-wrap' }}>{session?.translationEnglish || activePrayer?.translationEnglish || 'No translation'}</div>
      </div>
    </div>
  );
}
