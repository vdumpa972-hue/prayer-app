import type { Book, Prayer, SessionState, Tradition } from './types';

type QuickControlsProps = {
  styles: typeof import('./styles').styles;
  traditions: Tradition[];
  selectedTradition: Tradition | null;
  selectedBook: Book | null;
  activePrayer: Prayer | null;
  selectedTraditionId: string;
  selectedBookId: string;
  selectedPrayerId: string;
  sessionCode: string;
  session: SessionState | null;
  currentSection: { title: string } | null;
  speedMs: number;
  speechSupported: boolean;
  isListening: boolean;
  setSelectedTraditionId: (value: string) => void;
  setSelectedBookId: (value: string) => void;
  setSelectedPrayerId: (value: string) => void;
  setSpeedMs: (value: number) => void;
  createSession: () => void;
  applySelectedPrayerToSession: () => void;
  prevWord: () => void;
  nextWord: () => void;
  resetWords: () => void;
  setIsPlaying: (value: boolean) => void;
  prevSection: () => void;
  nextSection: () => void;
  startVoiceRecognition: () => void;
  stopVoiceRecognition: () => void;
};

export default function QuickControls(props: QuickControlsProps) {
  const {
    styles, traditions, selectedTradition, selectedBook, activePrayer, selectedTraditionId, selectedBookId, selectedPrayerId,
    sessionCode, session, currentSection, speedMs, speechSupported, isListening,
    setSelectedTraditionId, setSelectedBookId, setSelectedPrayerId, setSpeedMs,
    createSession, applySelectedPrayerToSession, prevWord, nextWord, resetWords, setIsPlaying,
    prevSection, nextSection, startVoiceRecognition, stopVoiceRecognition,
  } = props;

  return (
    <div style={styles.card}>
      <div style={styles.sectionTitle}>Quick Start</div>

      <label style={styles.label}>Religion / Tradition</label>
      <select value={selectedTraditionId} onChange={(e) => {
        const traditionId = e.target.value;
        const tradition = traditions.find((t) => t.id === traditionId) ?? null;
        const firstBook = tradition?.books[0] ?? null;
        const firstPrayer = firstBook?.prayers[0] ?? null;
        setSelectedTraditionId(traditionId);
        setSelectedBookId(firstBook?.id ?? '');
        setSelectedPrayerId(firstPrayer?.id ?? '');
      }} style={styles.select}>
        <option value="">Select religion</option>
        {traditions.map((tradition) => <option key={tradition.id} value={tradition.id}>{tradition.title}</option>)}
      </select>

      <div style={{ height: 10 }} />
      <label style={styles.label}>Prayer Book</label>
      <select value={selectedBookId} onChange={(e) => {
        const bookId = e.target.value;
        const book = selectedTradition?.books.find((b) => b.id === bookId) ?? null;
        setSelectedBookId(bookId);
        setSelectedPrayerId(book?.prayers[0]?.id ?? '');
      }} style={styles.select} disabled={!selectedTradition}>
        <option value="">Select book</option>
        {(selectedTradition?.books || []).map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
      </select>

      <div style={{ height: 10 }} />
      <label style={styles.label}>Prayer</label>
      <select value={selectedPrayerId} onChange={(e) => setSelectedPrayerId(e.target.value)} style={styles.select} disabled={!selectedBook}>
        <option value="">Select prayer</option>
        {(selectedBook?.prayers || []).map((prayer) => <option key={prayer.id} value={prayer.id}>{prayer.title}</option>)}
      </select>

      <div style={{ ...styles.infoBox, marginTop: 14 }}>
        <div><strong>Selected Prayer:</strong> {activePrayer?.title || '-'}</div>
        <div><strong>Language:</strong> {activePrayer?.language || '-'}</div>
        <div><strong>Session Code:</strong> {sessionCode || 'Not created yet'}</div>
        {session?.sections?.length ? (
          <>
            <div><strong>Sequence:</strong> {session.sequenceTitle || 'Saved sequence'}</div>
            <div><strong>Current Section:</strong> {currentSection?.title || session.currentSectionTitle || '-'}</div>
          </>
        ) : null}
      </div>

      <div style={{ ...styles.buttonRow, marginTop: 14 }}>
        <button style={styles.successBtn} onClick={createSession}>Create Session</button>
        <button style={styles.primaryBtn} disabled={!sessionCode || !activePrayer} onClick={applySelectedPrayerToSession}>Apply Prayer</button>
        <button style={styles.successBtn} disabled={!speechSupported || !sessionCode} onClick={startVoiceRecognition}>
          {isListening ? 'Voice Running' : 'Start Voice'}
        </button>
        <button style={styles.secondaryBtn} disabled={!speechSupported} onClick={stopVoiceRecognition}>Stop Voice</button>
      </div>

      <div style={{ ...styles.buttonRow, marginTop: 12 }}>
        <button style={styles.secondaryBtn} onClick={prevWord}>Back</button>
        <button style={styles.secondaryBtn} onClick={nextWord}>Next</button>
        <button style={styles.secondaryBtn} onClick={resetWords}>Reset</button>
        <button style={styles.secondaryBtn} onClick={() => setIsPlaying(true)}>Play</button>
        <button style={styles.secondaryBtn} onClick={() => setIsPlaying(false)}>Pause</button>
      </div>

      {session?.sections?.length ? (
        <div style={{ ...styles.buttonRow, marginTop: 12 }}>
          <button style={styles.secondaryBtn} onClick={prevSection}>Previous Section</button>
          <button style={styles.secondaryBtn} onClick={nextSection}>Next Section</button>
        </div>
      ) : null}

      <div style={{ marginTop: 14 }}>
        <label style={styles.label}>Speed (ms)</label>
        <input type="number" min={100} step={100} value={speedMs} onChange={(e) => setSpeedMs(Number(e.target.value) || 600)} style={{ ...styles.input, maxWidth: 160 }} />
      </div>
    </div>
  );
}
