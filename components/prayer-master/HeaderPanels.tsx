type HeaderPanelsProps = {
  styles: typeof import('./styles').styles;
  showHelp: boolean;
  showAbout: boolean;
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
  setShowAbout: React.Dispatch<React.SetStateAction<boolean>>;
  status: string;
};

export default function HeaderPanels({
  styles,
  showHelp,
  showAbout,
  setShowHelp,
  setShowAbout,
  status,
}: HeaderPanelsProps) {
  return (
    <>
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <h1 style={styles.title}>Prayer Master</h1>
          <p style={styles.subtitle}>Quick start on the main page. Advanced tools are tucked under the Tools menu.</p>
        </div>
        <div style={styles.buttonRow}>
          <button style={styles.secondaryBtn} onClick={() => setShowHelp((v) => !v)}>{showHelp ? 'Hide Help' : 'Help'}</button>
          <button style={styles.secondaryBtn} onClick={() => setShowAbout((v) => !v)}>{showAbout ? 'Hide About' : 'About'}</button>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}><span style={styles.badge}>Status: {status}</span></div>

      {showAbout && (
        <div style={{ ...styles.card, marginBottom: 18 }}>
          <div style={styles.sectionTitle}>About This App</div>
          <div style={{ lineHeight: 1.7 }}>
            Shalom Dahan is a retired software engineer with a burning mind. The idea of this app came up while admiring the AI revolution impact on our world and brainstorming ideas that might be needed.
          </div>
        </div>
      )}

      {showHelp && (
        <div style={{ ...styles.card, marginBottom: 18, background: '#fffdf7' }}>
          <div style={styles.sectionTitle}>Quick Start</div>
          <div style={{ lineHeight: 1.7 }}>
            The main page is now focused on praying quickly: choose prayer, create session, and start voice. Advanced tools like library loading, JSON import, and sequence building are under the Tools area below.
          </div>
        </div>
      )}
    </>
  );
}
