import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../../services/local-db/db';
import { analyzeMeeting } from '../../services/ai/ai-service';
import { useStore } from '../../store';

export default function MeetingDetailPage() {
  const { id } = useParams();

  const { openAiKey, anthropicKey } = useStore();
  const [meeting, setMeeting] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meetingData, transcriptData, analysisData] = await Promise.all([
          db.meetings.get(id),
          db.transcripts.where('meetingId').equals(id).first(),
          db.ai_analysis.where('meetingId').equals(id).first(),
        ]);
        setMeeting(meetingData);
        setTranscript(transcriptData);
        setAnalysis(analysisData?.summary ? analysisData : null);
      } catch (err) {
        console.error('Failed to load meeting:', err);
      }
    };
    fetchData();
  }, [id]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const transcriptText = transcript?.fullText || 'No transcript available for this meeting.';
      const apiKey = openAiKey || anthropicKey || 'test';
      const model = openAiKey ? 'openai' : 'anthropic';
      const result = await analyzeMeeting(transcriptText, id, apiKey, model);

      const analysisRecord = {
        id: `analysis_${id}`,
        meetingId: id,
        summary: result.analysis.summary,
        analyzedAt: new Date().toISOString(),
      };
      await db.ai_analysis.put(analysisRecord);
      setAnalysis(analysisRecord);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Failed to generate analysis. Check your API key in Settings.');
    } finally {
      setLoading(false);
    }
  };

  if (!meeting) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        Loading meeting...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '20px' }}>
        <Link to="/meetings" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          &larr; Back to Meetings
        </Link>
      </div>

      {/* Meeting Header */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>{meeting.title}</h1>
            <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              <span className="data-text">{formatDate(meeting.startTime)}</span>
              <span className="data-text">{meeting.duration} min</span>
              <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, backgroundColor: meeting.status === 'completed' ? 'rgba(78,205,196,0.12)' : 'rgba(240,201,41,0.12)', color: meeting.status === 'completed' ? 'var(--success)' : 'var(--warning)' }}>
                {meeting.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Transcript */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--accent-primary)' }}>Transcript</h2>
          {transcript?.fullText ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {transcript.fullText}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '14px' }}>No transcript available for this meeting.</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Transcripts are captured when the Zoom panel is active during a meeting.</p>
            </div>
          )}
        </div>

        {/* AI Analysis Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--accent-primary)' }}>AI Analysis</h2>

            {error && (
              <div style={{ padding: '12px', backgroundColor: 'rgba(233,69,96,0.1)', borderRadius: '8px', marginBottom: '16px', color: 'var(--danger)', fontSize: '13px' }}>
                {error}
              </div>
            )}

            {!analysis ? (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                  Generate an AI-powered summary, action items, and sentiment analysis for this meeting.
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  style={{ padding: '10px 16px', backgroundColor: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, width: '100%', opacity: loading ? 0.7 : 1, fontSize: '14px', transition: 'opacity 0.2s' }}
                >
                  {loading ? 'Analyzing...' : 'Generate Summary'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Summary</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>{analysis.summary}</p>
                </div>
                {analysis.analyzedAt && (
                  <p className="data-text" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    Analyzed {new Date(analysis.analyzedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
