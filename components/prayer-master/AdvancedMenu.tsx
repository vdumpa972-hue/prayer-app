import type { Book, Prayer, SequenceItem, SessionState, Tradition } from './types';

type AdvancedMenuProps = {
  styles: typeof import('./styles').styles;
  traditions: Tradition[];
  selectedTradition: Tradition | null;
  selectedBook: Book | null;
  activePrayer: Prayer | null;
  sessionCode: string;
  speechSupported: boolean;
  isListening: boolean;
  autoNextSectionByVoice: boolean;
  lastTranscript: string;
  jsonUrl: string;
  isImportingUrl: boolean;
  sequenceName: string;
  sequenceItems: SequenceItem[];
  customPrayerTitle: string;
  customPrayerText: string;
  customPrayerTranslation: string;
  setJsonUrl: React.Dispatch<React.SetStateAction<string>>;
  setAutoNextSectionByVoice: React.Dispatch<React.SetStateAction<boolean>>;
  setSequenceName: React.Dispatch<React.SetStateAction<string>>;
  setCustomPrayerTitle: React.Dispatch<React.SetStateAction<string>>;
  setCustomPrayerText: React.Dispatch<React.SetStateAction<string>>;
  setCustomPrayerTranslation: React.Dispatch<React.SetStateAction<string>>;
  handleJsonImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mergeSampleLibrary: () => void;
  replaceSampleLibrary: () => void;
  loadQuranFromAPI: () => void;
  loadBibleFromAPI: () => void;
  loadJewishFromSefaria: () => void;
  importJsonFromUrl: () => void;
  addSelectedPrayerToSequence: () => void;
  addCustomPrayerToSequence: () => void;
  moveSequenceItemUp: (index: number) => void;
  moveSequenceItemDown: (index: number) => void;
  removeSequenceItem: (id: string) => void;
  saveCustomSequence: () => void;
  clearSequence: () => void;
};

export default function AdvancedMenu(props: AdvancedMenuProps) {
  const {
    styles, selectedTradition, selectedBook, activePrayer, sessionCode, speechSupported, isListening, autoNextSectionByVoice,
    lastTranscript, jsonUrl, isImportingUrl, sequenceName, sequenceItems, customPrayerTitle, customPrayerText, customPrayerTranslation,
    setJsonUrl, setAutoNextSectionByVoice, setSequenceName, setCustomPrayerTitle, setCustomPrayerText, setCustomPrayerTranslation,
    handleJsonImport, mergeSampleLibrary, replaceSampleLibrary, loadQuranFromAPI, loadBibleFromAPI, loadJewishFromSefaria, importJsonFromUrl,
    addSelectedPrayerToSequence, addCustomPrayerToSequence, moveSequenceItemUp, moveSequenceItemDown, removeSequenceItem, saveCustomSequence, clearSequence,
  } = props;

  return (
    <div style={styles.menuCard}>
      <details>
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>Tools / Advanced Menu</summary>

        <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
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
            <div style={styles.sectionTitle}>Load JSON from URL</div>
            <input value={jsonUrl} onChange={(e) => setJsonUrl(e.target.value)} placeholder="https://example.com/prayer-library.json" style={styles.input} />
            <div style={{ marginTop: 12 }}>
              <button style={styles.amberBtn} disabled={isImportingUrl} onClick={importJsonFromUrl}>
                {isImportingUrl ? 'Loading...' : 'Load JSON from URL'}
              </button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionTitle}>Voice Advanced</div>
            <div><strong>Supported:</strong> {speechSupported ? 'Yes' : 'No'}</div>
            <div><strong>Status:</strong> {isListening ? 'Listening' : 'Stopped'}</div>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
              <input type="checkbox" checked={autoNextSectionByVoice} onChange={(e) => setAutoNextSectionByVoice(e.target.checked)} />
              Auto-next section when voice reaches the end
            </label>
            <div style={{ ...styles.infoBox, marginTop: 12 }}>
              <strong>Live Transcript:</strong> {lastTranscript || '(nothing heard yet)'}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sectionTitle}>Custom Prayer Sequence Builder</div>
            <div style={{ ...styles.infoBox, marginBottom: 14 }}>
              <div><strong>Selected Tradition:</strong> {selectedTradition?.title || '-'}</div>
              <div><strong>Selected Book:</strong> {selectedBook?.title || '-'}</div>
              <div><strong>Selected Prayer:</strong> {activePrayer?.title || '-'}</div>
              <div><strong>Session Code:</strong> {sessionCode || 'Not created yet'}</div>
            </div>

            <div style={styles.buttonRow}><button style={styles.primaryBtn} onClick={addSelectedPrayerToSequence}>Add Selected Prayer</button></div>

            <div style={{ height: 18 }} />
            <div style={styles.smallTitle}>Add Your Own Custom Prayer</div>
            <input value={customPrayerTitle} onChange={(e) => setCustomPrayerTitle(e.target.value)} placeholder="Custom prayer title" style={{ ...styles.input, marginBottom: 10 }} />
            <textarea value={customPrayerText} onChange={(e) => setCustomPrayerText(e.target.value)} placeholder="Custom prayer text" rows={5} style={{ ...styles.textarea, marginBottom: 10 }} />
            <textarea value={customPrayerTranslation} onChange={(e) => setCustomPrayerTranslation(e.target.value)} placeholder="Custom prayer translation (optional)" rows={3} style={{ ...styles.textarea, marginBottom: 10 }} />
            <button style={styles.secondaryBtn} onClick={addCustomPrayerToSequence}>Add Custom Prayer</button>

            <div style={{ height: 20 }} />
            <div style={styles.smallTitle}>Sequence Items</div>

            {sequenceItems.length === 0 ? (
              <div style={styles.infoBox}>No prayers in the sequence yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {sequenceItems.map((item, index) => (
                  <div key={item.id} style={styles.seqItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{index + 1}. {item.title}</div>
                        <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{item.sourceLabel || 'Sequence item'}</div>
                        <div style={{ marginTop: 8, fontSize: 14, color: '#334155' }}>
                          {item.originalText.slice(0, 140)}{item.originalText.length > 140 ? '...' : ''}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        <button style={styles.secondaryBtn} onClick={() => moveSequenceItemUp(index)}>Up</button>
                        <button style={styles.secondaryBtn} onClick={() => moveSequenceItemDown(index)}>Down</button>
                        <button style={styles.dangerBtn} onClick={() => removeSequenceItem(item.id)}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ height: 18 }} />
            <input value={sequenceName} onChange={(e) => setSequenceName(e.target.value)} placeholder="Name for saved sequence" style={{ ...styles.input, marginBottom: 12 }} />
            <div style={styles.buttonRow}>
              <button style={styles.successBtn} onClick={saveCustomSequence}>Save Sequence to DB</button>
              <button style={styles.secondaryBtn} onClick={clearSequence}>Clear Sequence</button>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
