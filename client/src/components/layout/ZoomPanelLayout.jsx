import { Outlet, NavLink } from 'react-router-dom';
import { Mic, Lightbulb, PenSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { initZoom } from '../../services/zoom/zoom-sdk';

const ZoomPanelLayout = () => {
  const [isZoomReady, setIsZoomReady] = useState(false);

  useEffect(() => {
    const setupZoom = async () => {
      try {
        await initZoom();
      } catch (err) {
        console.warn('Running outside of Zoom environment.', err);
      }
      setIsZoomReady(true);
    };
    setupZoom();
  }, []);

  if (!isZoomReady) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        Initializing Zoom...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '8px' }}>
        <NavLink
          to="/zoom-panel/transcription"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '14px',
            backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
            color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          })}
        >
          <Mic size={16} />
          Transcript
        </NavLink>
        <NavLink
          to="/zoom-panel/suggestions"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '14px',
            backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
            color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          })}
        >
          <Lightbulb size={16} />
          Suggestions
        </NavLink>
        <NavLink
          to="/zoom-panel/notes"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '14px',
            backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
            color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          })}
        >
          <PenSquare size={16} />
          Notes
        </NavLink>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default ZoomPanelLayout;
