import type { Book, Prayer, SessionState, Tradition } from './types';

type LeftPanelProps = {
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
  autoNextSectionByVoice: boolean;
  lastTranscript: string;
  jsonUrl: string;
  isImportingUrl: boolean;
  setSelectedTraditionId: (value: string) => void;
  setSelectedBookId: (value: string) => void;
  setSelectedPrayerId: (value: string) => void;
  setSpeedMs: (value: number) => void;
  setJsonUrl: (value: string) => void;
  setAutoNextSectionByVoice: (value: boolean) => void;
  handleJsonImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mergeSampleLibrary: () => void;
  replaceSampleLibrary: () => void;
  loadQuranFromAPI: () => void;
  loadBibleFromAPI: () => void;
  loadJewishFromSefaria: () => void;
  importJsonFromUrl: () => void;
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

export default function LeftPanel(props: LeftPanelProps) {
  const {
    styles, traditions, selectedTradition, selectedBook, activePrayer, selectedTraditionId, selectedBookId, selectedPrayerId,
    sessionCode, session, currentSection, speedMs, speechSupported, isListening, autoNextSectionByVoice, lastTranscript,
    jsonUrl, isImportingUrl, setSelectedTraditionId, setSelectedBookId, setSelectedPrayerId, setSpeedMs, setJsonUrl,
    setAutoNextSectionByVoice, handleJsonImport, mergeSampleLibrary, replaceSampleLibrary, loadQuranFromAPI, loadBibleFromAPI,
    loadJewishFromSefaria, importJsonFromUrl, createSession, applySelectedPrayerToSession, prevWord, nextWord, resetWords,
    setIsPlaying, prevSection, nextSection, startVoiceRecognition, stopVoiceRecognition,
  } = props;

  return (
    <div style={styles.leftCol}>
      <div style={styles.card}>
        <div style={styles.sectionTitle}>Library Actions</div>
        <div style={styles.buttonRow}>
          <button style={styles.primaryBtn} onClick={mergeSampleLibrary}>Merge Sample Library</button>
          <button style={{ ...styles.primaryBtn, background: '#1d4ed8' }} onClick={replaceSampleLibrary}>Replace Sample Library</button>
          <label style={{ ...styles.mutedBtn, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            Import JSON
            <input type="file" accept=".json,application/json" onChange={handleJsonImport} style={{ display: 'none' }} />
          </label>
        </div>
        <div style={{ ...styles.infoBox, marginTop: 14 }}>Use merge to add newer built-in prayers. Use replace to fully refresh the built-in library.</div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>API Loaders</div>
        <div style={styles.buttonRow}>
          <button style={styles.successBtn} onClick={loadQuranFromAPI}>Load Quran (API)</button>
          <button style={styles.dangerBtn} onClick={loadBibleFromAPI}>Load Bible (API)</button>
          <button style={styles.amberBtn} onClick={loadJewishFromSefaria}>Load Jewish (Sefaria)</button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Load JSON from URL / API</div>
        <input value={jsonUrl} onChange={(e) => setJsonUrl(e.target.value)} placeholder="https://example.com/prayer-library.json" style={styles.input} />
        <div style={{ marginTop: 12 }}>
          <button style={styles.amberBtn} disabled={isImportingUrl} onClick={importJsonFromUrl}>{isImportingUrl ? 'Loading...' : 'Load JSON from URL'}</button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Session Controls</div>
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

        <div style={{ height: 12 }} />
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

        <div style={{ height: 12 }} />
        <label style={styles.label}>Prayer</label>
        <select value={selectedPrayerId} onChange={(e) => setSelectedPrayerId(e.target.value)} style={styles.select} disabled={!selectedBook}>
          <option value="">Select prayer</option>
          {(selectedBook?.prayers || []).map((prayer) => <option key={prayer.id} value={prayer.id}>{prayer.title}</option>)}
        </select>

        <div style={{ ...styles.infoBox, marginTop: 14 }}>
          <div><strong>Selected Religion:</strong> {selectedTradition?.title || '-'}</div>
          <div><strong>Selected Book:</strong> {selectedBook?.title || '-'}</div>
          <div><strong>Selected Prayer:</strong> {activePrayer?.title || '-'}</div>
          <div><strong>Language:</strong> {activePrayer?.language || '-'}</div>
          <div><strong>Source:</strong> {activePrayer?.sourceName || '-'}</div>
        </div>

        <div style={{ ...styles.buttonRow, marginTop: 14 }}>
          <button style={styles.successBtn} onClick={createSession}>Create Session</button>
          <button style={styles.primaryBtn} disabled={!sessionCode || !activePrayer} onClick={applySelectedPrayerToSession}>Apply Selected Prayer</button>
        </div>

        <div style={{ marginTop: 14, fontSize: 20, fontWeight: 700 }}>Session Code: {sessionCode || 'Not created yet'}</div>

        {session?.sections?.length ? (
          <div style={{ ...styles.infoBox, marginTop: 14 }}>
            <div><strong>Sequence:</strong> {session.sequenceTitle || 'Saved sequence'}</div>
            <div><strong>Current Section:</strong> {currentSection?.title || session.currentSectionTitle || '-'}</div>
            <div><strong>Section Position:</strong> {(session.currentSectionIndex ?? 0) + 1} / {session.sections.length}</div>
          </div>
        ) : null}

        <div style={{ ...styles.buttonRow, marginTop: 14 }}>
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

      <div style={styles.card}>
        <div style={styles.sectionTitle}>Voice Recognition</div>
        <div style={{ marginBottom: 10 }}><strong>Supported:</strong> {speechSupported ? 'Yes' : 'No'}</div>
        <div style={{ marginBottom: 10 }}><strong>Status:</strong> {isListening ? 'Listening' : 'Stopped'}</div>
        <div style={styles.buttonRow}>
          <button style={styles.successBtn} disabled={!speechSupported || !sessionCode} onClick={startVoiceRecognition}>Start Voice</button>
          <button style={styles.secondaryBtn} disabled={!speechSupported} onClick={stopVoiceRecognition}>Stop Voice</button>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
          <input type="checkbox" checked={autoNextSectionByVoice} onChange={(e) => setAutoNextSectionByVoice(e.target.checked)} />
          Auto-next section when voice reaches the end
        </label>
        <div style={{ ...styles.infoBox, marginTop: 12 }}>
          <strong>Live Transcript:</strong> {lastTranscript || '(nothing heard yet)'}
        </div>
      </div>
    </div>
  );
}
