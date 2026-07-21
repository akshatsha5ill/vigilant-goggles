import { useEffect, useState } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

const SuggestionsView = () => {
  const [suggestions, setSuggestions] = useState([]);
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe('ai_suggestion', (suggestion) => {
      setSuggestions((prev) => [suggestion, ...prev]);
    });
    return () => unsubscribe();
  }, [subscribe]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-primary)', padding: '16px', color: 'var(--text-primary)' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Live Suggestions</h2>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {suggestions.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>
            AI is listening... Suggestions will appear here.
          </div>
        ) : (
          suggestions.map((s, idx) => (
            <div key={idx} style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid var(--accent-primary)', marginBottom: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 4px 0' }}>{s.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{s.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SuggestionsView;
