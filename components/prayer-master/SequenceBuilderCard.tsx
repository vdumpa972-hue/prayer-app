import type { SequenceItem } from './types';

type SequenceBuilderCardProps = {
  styles: typeof import('./styles').styles;
  sequenceItems: SequenceItem[];
  sequenceName: string;
  customPrayerTitle: string;
  customPrayerText: string;
  customPrayerTranslation: string;
  setSequenceName: React.Dispatch<React.SetStateAction<string>>;
  setCustomPrayerTitle: React.Dispatch<React.SetStateAction<string>>;
  setCustomPrayerText: React.Dispatch<React.SetStateAction<string>>;
  setCustomPrayerTranslation: React.Dispatch<React.SetStateAction<string>>;
  addSelectedPrayerToSequence: () => void;
  addCustomPrayerToSequence: () => void;
  moveSequenceItemUp: (index: number) => void;
  moveSequenceItemDown: (index: number) => void;
  removeSequenceItem: (id: string) => void;
  saveCustomSequence: () => void;
  clearSequence: () => void;
};

export default function SequenceBuilderCard(props: SequenceBuilderCardProps) {
  const {
    styles, sequenceItems, sequenceName, customPrayerTitle, customPrayerText, customPrayerTranslation,
    setSequenceName, setCustomPrayerTitle, setCustomPrayerText, setCustomPrayerTranslation,
    addSelectedPrayerToSequence, addCustomPrayerToSequence, moveSequenceItemUp, moveSequenceItemDown,
    removeSequenceItem, saveCustomSequence, clearSequence,
  } = props;

  return (
    <div style={styles.card}>
      <div style={styles.sectionTitle}>Custom Prayer Sequence Builder</div>
      <div style={styles.buttonRow}><button style={styles.primaryBtn} onClick={addSelectedPrayerToSequence}>Add Selected Prayer</button></div>
      <div style={{ ...styles.infoBox, marginTop: 14 }}>Build a named sequence from existing prayers in the library, then save it into Firebase as a reusable collection.</div>

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
  );
}
