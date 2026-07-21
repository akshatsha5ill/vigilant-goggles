import { useState } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

const NotesView = () => {
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const { emit } = useWebSocket();

  const handleSave = () => {
    if (!note.trim()) return;
    emit('save_note', { content: note, timestamp: new Date().toISOString() });
    setSaved(true);
    setNote('');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)', padding: '16px', color: 'var(--text-primary)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Quick Notes</h2>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <textarea
          style={{ flex: 1, width: '100%', padding: '16px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '12px', resize: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1.5 }}
          placeholder="Jot down quick thoughts here... they will sync to your dashboard."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleSave} style={{ backgroundColor: 'var(--accent-primary)', color: '#000', fontWeight: 700, padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'background-color 0.2s' }}>
            Save Note
          </button>
          {saved && <span style={{ color: 'var(--success)', fontSize: '14px' }}>Saved!</span>}
        </div>
      </div>
    </div>
  );
};

export default NotesView;
