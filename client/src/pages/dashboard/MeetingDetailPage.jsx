import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../../services/local-db/db';
import { analyzeMeeting } from '../../services/ai/ai-service';
import { useStore } from '../../store';

export default function MeetingDetailPage() {
  const { id } = useParams();
  const { openAiKey } = useStore();
  const [meeting, setMeeting] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMeeting = async () => {
      const data = await db.meetings.get(id);
      setMeeting(data);
    };
    fetchMeeting();
  }, [id]);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // In a real app this would use the real transcript text
      const transcript = "[00:00:00] Mock Transcript data.";
      const result = await analyzeMeeting(transcript, id, openAiKey || "test", "openai");
      setAnalysis(result.analysis);
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (!meeting) return <div style={{ padding: '20px' }}>Loading meeting...</div>;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/meetings" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>← Back to Meetings</Link>
      </div>

      <div className="glass-card" style={{ padding: '30px', marginBottom: '20px' }}>
        <h1 style={{ marginTop: 0, color: 'var(--text-primary)' }}>{meeting.title}</h1>
        <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)' }}>
          <span className="data-text">Duration: {meeting.duration} min</span>
          <span className="data-text">Status: {meeting.status}</span>
          <span className="data-text">ID: {meeting.zoomMeetingId}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '25px' }}>
          <h2 style={{ marginTop: 0, color: 'var(--accent-primary)' }}>Transcript</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            [00:00:00] John: Hello everyone, thanks for joining the {meeting.title} call today.
            <br />
            [00:00:15] Jane: Thanks for having us. Let's get right into the feature updates.
            <br />
            [00:00:30] John: Great, I'll pull up the roadmap now...
            <br />
            <br />
            <em className="data-text">(Mock transcript data. In a real app, this would be fetched from IndexedDB transcripts store synced via Zoom webhooks.)</em>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '25px' }}>
            <h2 style={{ marginTop: 0, color: 'var(--accent-primary)' }}>AI Analysis</h2>

            {!analysis ? (
              <button
                onClick={handleAnalyze}
                disabled={loading}
                style={{ padding: '10px 15px', backgroundColor: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', width: '100%', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Analyzing...' : 'Generate Summary'}
              </button>
            ) : (
              <div>
                <h3 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Summary</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 20px 0' }}>{analysis.summary}</p>

                <h3 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Action Items</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  <li>Follow up with Jane regarding roadmap feature priority.</li>
                  <li>Schedule next sync for next week.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
