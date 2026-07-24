import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import { encryptKey, decryptKey } from '../../crypto/key-vault';
import { db } from '../../services/local-db/db';
import { requestPersistence, exportAllData, importData, downloadJSON, getStorageUsage } from '../../services/local-db/backup';

export default function SettingsPage() {
  const { setOpenAiKey, setAnthropicKey, setGeminiKey, setResendKey } = useStore();
  const [localOpenAi, setLocalOpenAi] = useState('');
  const [localAnthropic, setLocalAnthropic] = useState('');
  const [localGemini, setLocalGemini] = useState('');
  const [localResend, setLocalResend] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingKeys, setPendingKeys] = useState<any>(null);

  const [isPersisted, setIsPersisted] = useState(false);
  const [storageUsage, setStorageUsage] = useState<any>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);

  useEffect(() => {
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(setIsPersisted);
    }
    getStorageUsage().then(setStorageUsage);
    setAutoBackupEnabled(localStorage.getItem('dealforge_autobackup') === 'true');
  }, []);

  const handleRequestPersistence = async () => {
    const granted = await requestPersistence();
    setIsPersisted(granted);
  };

  const handleExport = async () => {
    setBackupLoading(true);
    try {
      const data = await exportAllData();
      downloadJSON(data);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleImport = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBackupLoading(true);
    setImportStatus('Reading file...');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      setImportStatus('Importing data...');
      await importData(data);
      setImportStatus('Import successful! Refresh to see changes.');
    } catch (err) {
      console.error('Import failed:', err);
      setImportStatus('Import failed. Invalid file.');
    } finally {
      setBackupLoading(false);
      setTimeout(() => setImportStatus(''), 3000);
    }
  };

  const toggleAutoBackup = (e: any) => {
    const val = e.target.checked;
    setAutoBackupEnabled(val);
    localStorage.setItem('dealforge_autobackup', val.toString());
  };

  const decryptKeys = useCallback(async (encryptedData: any) => {
    if (!password) return;
    try {
      if (encryptedData.openAi) {
        const key = await decryptKey(encryptedData.openAi, password);
        if (key) setLocalOpenAi(key);
      }
      if (encryptedData.anthropic) {
        const key = await decryptKey(encryptedData.anthropic, password);
        if (key) setLocalAnthropic(key);
      }
      if (encryptedData.gemini) {
        const key = await decryptKey(encryptedData.gemini, password);
        if (key) setLocalGemini(key);
      }
      if (encryptedData.resend) {
        const key = await decryptKey(encryptedData.resend, password);
        if (key) setLocalResend(key);
      }
    } catch {
      // Password incorrect or data corrupted
    }
  }, [password]);

  useEffect(() => {
    const loadKeys = async () => {
      const stored = await db.settings.get('dealforge_encrypted_keys');
      if (stored && stored.value && password) {
        decryptKeys(stored.value);
      }
    };
    loadKeys();
  }, [password, decryptKeys]);

  const handleSave = async (e) => {
    e.preventDefault();
    setPendingKeys({ openAi: localOpenAi, anthropic: localAnthropic, gemini: localGemini, resend: localResend });
    setShowPasswordPrompt(true);
  };

  const confirmSave = async () => {
    if (!password) return;
    setLoading(true);
    try {
      const encrypted = {};
      if (pendingKeys.openAi) {
        encrypted.openAi = await encryptKey(pendingKeys.openAi, password);
      }
      if (pendingKeys.anthropic) {
        encrypted.anthropic = await encryptKey(pendingKeys.anthropic, password);
      }
      if (pendingKeys.gemini) {
        encrypted.gemini = await encryptKey(pendingKeys.gemini, password);
      }
      if (pendingKeys.resend) {
        encrypted.resend = await encryptKey(pendingKeys.resend, password);
      }
      
      await db.settings.put({ key: 'dealforge_encrypted_keys', value: encrypted });

      setOpenAiKey(pendingKeys.openAi);
      setAnthropicKey(pendingKeys.anthropic);
      setGeminiKey(pendingKeys.gemini);
      setResendKey(pendingKeys.resend);

      setSaved(true);
      setShowPasswordPrompt(false);
      setPendingKeys(null);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Encryption failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!password) return;
    setLoading(true);
    try {
      const stored = await db.settings.get('dealforge_encrypted_keys');
      if (stored && stored.value) {
        await decryptKeys(stored.value);
      }
      setShowPasswordPrompt(false);
    } catch {
      console.error('Decryption failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    marginBottom: '20px',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '14px',
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Manage your API keys and account preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '900px' }}>
        {/* API Keys Section */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--accent-primary)' }}>API Keys (BYOK)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '13px', lineHeight: 1.5 }}>
            Your keys are encrypted client-side using AES-256-GCM and stored in your browser. They are never sent to our servers.
          </p>

          <form onSubmit={handleSave}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>OpenAI API Key</label>
            <input
              type="password"
              value={localOpenAi}
              onChange={(e) => setLocalOpenAi(e.target.value)}
              placeholder="sk-..."
              style={inputStyle}
            />

            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>Anthropic API Key</label>
            <input
              type="password"
              value={localAnthropic}
              onChange={(e) => setLocalAnthropic(e.target.value)}
              placeholder="sk-ant-..."
              style={inputStyle}
            />

            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>Gemini API Key</label>
            <input
              type="password"
              value={localGemini}
              onChange={(e) => setLocalGemini(e.target.value)}
              placeholder="AIza..."
              style={inputStyle}
            />

            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>Resend API Key (for Emails)</label>
            <input
              type="password"
              value={localResend}
              onChange={(e) => setLocalResend(e.target.value)}
              placeholder="re_..."
              style={inputStyle}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="submit"
                style={{ padding: '10px 20px', backgroundColor: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}
              >
                Save Keys
              </button>
              {saved && <span style={{ color: 'var(--success)', fontSize: '14px' }}>Keys encrypted and saved!</span>}
            </div>
          </form>
        </div>

        {/* Password / Security Section */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--accent-primary)' }}>Encryption Password</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '13px', lineHeight: 1.5 }}>
            Set a password to encrypt/decrypt your API keys. You'll need this password to restore keys after clearing browser data.
          </p>

          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '13px' }}>Encryption Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a strong password"
            style={inputStyle}
          />

          <button
            onClick={handleUnlock}
            disabled={!password || loading}
            style={{ padding: '10px 20px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: password && !loading ? 'pointer' : 'not-allowed', fontWeight: 500, fontSize: '14px', opacity: password && !loading ? 1 : 0.5 }}
          >
            {loading ? 'Decrypting...' : 'Unlock Saved Keys'}
          </button>

          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Security Notes</h3>
            <ul style={{ color: 'var(--text-muted)', fontSize: '12px', paddingLeft: '16px', lineHeight: 1.8 }}>
              <li>Keys are encrypted with AES-256-GCM (PBKDF2, 100K iterations)</li>
              <li>Encryption/decryption happens entirely in your browser</li>
              <li>Our servers never see your plaintext API keys</li>
              <li>Lost password = lost keys (we cannot recover them)</li>
            </ul>
          </div>
        </div>

        {/* Data Management Section */}
        <div className="glass-card" style={{ padding: '28px', gridColumn: '1 / -1' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--accent-primary)' }}>Data Management & Durability</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '13px', lineHeight: 1.5 }}>
            Manage your local database, ensure data persistence, and perform backups. All your data lives in this browser.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Storage Persistence</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>
                Status: <span style={{ color: isPersisted ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>{isPersisted ? 'Persistent' : 'Temporary'}</span>
              </p>
              {!isPersisted && (
                <button
                  type="button"
                  onClick={handleRequestPersistence}
                  style={{ padding: '8px 16px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Request Persistent Storage
                </button>
              )}
              {storageUsage && (
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '12px' }}>
                  Storage Used: {(storageUsage.used / 1024 / 1024).toFixed(2)} MB of {(storageUsage.quota / 1024 / 1024).toFixed(2)} MB ({storageUsage.percent}%)
                </p>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Manual Backup</h3>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={backupLoading}
                  style={{ padding: '8px 16px', backgroundColor: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px', cursor: backupLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  {backupLoading ? 'Exporting...' : 'Export JSON Backup'}
                </button>
                <label style={{ padding: '8px 16px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: backupLoading ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
                  Import JSON
                  <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} disabled={backupLoading} />
                </label>
              </div>
              {importStatus && <p style={{ color: 'var(--success)', fontSize: '13px', marginBottom: '12px' }}>{importStatus}</p>}

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="autoBackup" checked={autoBackupEnabled} onChange={toggleAutoBackup} />
                <label htmlFor="autoBackup" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Enable daily auto-backup download</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Encryption Prompt Modal */}
      {showPasswordPrompt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ padding: '32px', width: '400px', maxWidth: '90vw' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Set Encryption Password</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>Choose a strong password to encrypt your API keys.</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{ ...inputStyle, marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowPasswordPrompt(false); setPendingKeys(null); }} style={{ padding: '10px 16px', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
              <button onClick={confirmSave} disabled={!password || loading} style={{ padding: '10px 16px', backgroundColor: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px', cursor: password && !loading ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '14px' }}>
                {loading ? 'Encrypting...' : 'Save & Encrypt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
