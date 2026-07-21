import { Link } from 'react-router-dom';
import { Home, Video, Users, Settings } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="glass-card" style={{ width: '250px', height: '100vh', padding: '20px', borderRadius: '0' }}>
      <h2 style={{ color: 'var(--accent-primary)', marginBottom: '30px' }}>MeetFlow</h2>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <Link to="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}><Home size={20} /> Dashboard</Link>
        <Link to="/meetings" style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}><Video size={20} /> Meetings</Link>
        <Link to="/leads" style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={20} /> Leads</Link>
        <Link to="/settings" style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}><Settings size={20} /> Settings</Link>
      </nav>
    </div>
  );
}
