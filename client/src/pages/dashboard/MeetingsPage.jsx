import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/local-db/db';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await db.meetings.toArray();
        setMeetings(data);
      } catch (err) {
        console.error('Failed to load meetings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const filtered = meetings.filter((m) => m.title?.toLowerCase().includes(search.toLowerCase()));

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>Meetings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{meetings.length} total meetings</p>
        </div>
        <input
          type="text"
          placeholder="Search meetings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', width: '250px' }}
        />
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>{search ? 'No meetings match your search' : 'No meetings yet'}</p>
            <p style={{ fontSize: '13px' }}>{search ? 'Try a different search term' : 'Start a meeting in Zoom to see data here.'}</p>
          </div>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Title', 'Date', 'Duration', 'Status'].map((h) => (
                  <th key={h} style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border)', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} onClick={() => navigate(`/meetings/${m.id}`)} style={{ cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{m.title}</td>
                  <td className="data-text" style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{formatDate(m.startTime)}</td>
                  <td className="data-text" style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>{m.duration} min</td>
                  <td style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, backgroundColor: m.status === 'completed' ? 'rgba(78,205,196,0.12)' : 'rgba(240,201,41,0.12)', color: m.status === 'completed' ? 'var(--success)' : 'var(--warning)' }}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
