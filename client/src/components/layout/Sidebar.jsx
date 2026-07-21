import { NavLink } from 'react-router-dom';
import { Home, Video, Users, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard', end: true },
  { to: '/meetings', icon: Video, label: 'Meetings' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  return (
    <div style={{ width: '250px', height: '100vh', padding: '20px', backgroundColor: 'var(--bg-glass)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <h2 style={{ color: 'var(--accent-primary)', marginBottom: '30px', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>MeetFlow</h2>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.2s ease',
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
