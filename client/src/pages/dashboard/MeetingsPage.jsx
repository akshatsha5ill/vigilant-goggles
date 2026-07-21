import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/local-db/db';
import { mockMeetings } from '../../utils/mockData';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMeetings = async () => {
      const data = await db.meetings.toArray();
      setMeetings(data);
    };
    fetchMeetings();
  }, []);

  const populateMockData = async () => {
    await db.meetings.bulkPut(mockMeetings);
    const data = await db.meetings.toArray();
    setMeetings(data);
  };

  return (
    <div>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>Meetings</h1>
      <button onClick={populateMockData} style={{ padding: '8px 16px', marginBottom: '20px', backgroundColor: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Populate Mock Data</button>
      <div className="glass-card" style={{ padding: '20px' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>Title</th>
              <th style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>Duration</th>
              <th style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map((meeting) => (
              <tr
                key={meeting.id}
                onClick={() => navigate(`/meetings/${meeting.id}`)}
                style={{ transition: 'background-color 0.2s ease', cursor: 'pointer' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>{meeting.title}</td>
                <td className="data-text" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>{meeting.duration} min</td>
                <td className="data-text" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>{meeting.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {meetings.length === 0 && <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>No meetings found.</p>}
      </div>
    </div>
  );
}
