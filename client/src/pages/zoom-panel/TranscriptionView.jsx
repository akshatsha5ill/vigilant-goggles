import { useEffect, useState } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

const TranscriptionView = () => {
  const [transcripts, setTranscripts] = useState([]);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('transcription', (segment) => {
      setTranscripts((prev) => [...prev, segment]);
    });
    return () => unsubscribe();
  }, [subscribe]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)', padding: '16px', color: 'var(--text-primary)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Live Transcription</h2>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        {transcripts.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Waiting for transcription to start...
          </div>
        ) : (
          transcripts.map((t, idx) => (
            <div key={`${idx}-${t.speaker || 'unknown'}`} style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px', display: 'block' }}>
                {t.speaker || 'Speaker'}
              </span>
              <p style={{ fontSize: '14px', margin: 0, lineHeight: 1.5 }}>{t.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TranscriptionView;
