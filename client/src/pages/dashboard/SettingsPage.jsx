import { useState, useEffect } from 'react';
import { useStore } from '../../store';

export default function SettingsPage() {
  const { openAiKey, anthropicKey, setOpenAiKey, setAnthropicKey } = useStore();
  const [localOpenAi, setLocalOpenAi] = useState(openAiKey);
  const [localAnthropic, setLocalAnthropic] = useState(anthropicKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalOpenAi(openAiKey);
    setLocalAnthropic(anthropicKey);
  }, [openAiKey, anthropicKey]);

  const handleSave = (e) => {
    e.preventDefault();
    setOpenAiKey(localOpenAi);
    setAnthropicKey(localAnthropic);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '20px',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontFamily: 'JetBrains Mono, monospace'
  };

  return (
    <div>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>Settings</h1>

      <div className="glass-card" style={{ padding: '30px', maxWidth: '600px' }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--accent-primary)' }}>API Keys (BYOK)</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          MeetFlow uses a Bring-Your-Own-Key (BYOK) model to ensure privacy. Your keys are stored locally in your browser and are never saved to our servers.
        </p>

        <form onSubmit={handleSave}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>OpenAI API Key</label>
          <input
            type="password"
            value={localOpenAi}
            onChange={(e) => setLocalOpenAi(e.target.value)}
            placeholder="sk-..."
            style={inputStyle}
          />

          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Anthropic API Key</label>
          <input
            type="password"
            value={localAnthropic}
            onChange={(e) => setLocalAnthropic(e.target.value)}
            placeholder="sk-ant-..."
            style={inputStyle}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              type="submit"
              style={{ padding: '10px 20px', backgroundColor: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Save Keys
            </button>
            {saved && <span style={{ color: 'var(--success)' }}>Keys saved locally!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
