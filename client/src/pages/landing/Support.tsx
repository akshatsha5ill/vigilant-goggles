export default function Support() {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '20px', color: 'var(--accent-primary)' }}>Help & Support</h1>
      
      <h2 style={{ marginTop: '30px', fontSize: '24px' }}>Contact Us</h2>
      <p>If you need help configuring DealForge or have encountered a bug, please email us at <strong>support@dealforge.com</strong>.</p>
      
      <h2 style={{ marginTop: '30px', fontSize: '24px' }}>Frequently Asked Questions</h2>
      
      <h3 style={{ marginTop: '20px', fontSize: '18px' }}>Where is my meeting data stored?</h3>
      <p style={{ color: 'var(--text-secondary)' }}>Your data is securely stored in your web browser's local database (IndexedDB). It is never permanently stored on our servers.</p>
      
      <h3 style={{ marginTop: '20px', fontSize: '18px' }}>How do I uninstall the app?</h3>
      <p style={{ color: 'var(--text-secondary)' }}>You can uninstall the app directly from the Zoom App Marketplace. Go to Manage > Installed Apps and click Uninstall next to DealForge.</p>
      
      <h3 style={{ marginTop: '20px', fontSize: '18px' }}>How do I delete my data?</h3>
      <p style={{ color: 'var(--text-secondary)' }}>To delete your data, clear your browser data or use the "Reset Local Database" option in the DealForge Settings page.</p>
    </div>
  );
}
