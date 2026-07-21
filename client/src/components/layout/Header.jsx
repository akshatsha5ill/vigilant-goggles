import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useStore } from '../../store';
import { logoutUser } from '../../services/firebase/auth';

export default function Header() {
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 20px', backgroundColor: 'var(--bg-glass)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{user?.email || 'user@example.com'}</span>
        <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-primary)', fontWeight: 'bold', fontSize: '14px' }}>
          {initials}
        </div>
        <button
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'color 0.2s, background-color 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
