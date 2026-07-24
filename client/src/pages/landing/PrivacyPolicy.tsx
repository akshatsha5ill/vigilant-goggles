export default function PrivacyPolicy() {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px', color: 'var(--accent-primary)' }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2 style={{ marginTop: '30px', fontSize: '24px' }}>1. Data Storage & Privacy</h2>
      <p>DealForge operates with a privacy-first approach. All sensitive data (including meeting transcripts, AI analyses, lead details, and email drafts) is stored strictly in your browser's local IndexedDB. Our backend servers act purely as a stateless relay and do not permanently store your meeting data.</p>
      
      <h2 style={{ marginTop: '30px', fontSize: '24px' }}>2. Bring Your Own Key (BYOK)</h2>
      <p>Your OpenAI, Anthropic, Gemini, or Resend API keys are encrypted locally in your browser using AES-256-GCM. We never store plaintext keys on our servers.</p>
      
      <h2 style={{ marginTop: '30px', fontSize: '24px' }}>3. Data Deletion (Zoom Compliance)</h2>
      <p>If you uninstall the DealForge app from your Zoom account, Zoom sends us a Deauthorization request. However, because we do not store your data on our servers, to fully delete your data, you must clear your browser's local storage (IndexedDB) via the DealForge dashboard Settings or browser controls.</p>
      
      <h2 style={{ marginTop: '30px', fontSize: '24px' }}>4. Third-Party Services</h2>
      <p>We use Firebase for authentication and basic account management, and Stripe for subscription billing. Only basic account information (name, email) is shared with these services.</p>
    </div>
  );
}
