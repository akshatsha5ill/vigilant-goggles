import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useStore } from '../../store';
import { AlertCircle, X } from 'lucide-react';
import { useAutoBackup } from '../../hooks/useAutoBackup';

export default function DashboardLayout() {
  useAutoBackup();
  const error = useStore((state) => state.error);
  const clearError = useStore((state) => state.clearError);
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Header />
        {error && (
          <div style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> {error}</div>
            <button onClick={clearError} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={16} /></button>
          </div>
        )}
        <main style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
