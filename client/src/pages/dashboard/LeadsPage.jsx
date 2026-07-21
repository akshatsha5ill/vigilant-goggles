import { useState, useEffect } from 'react';
import { db } from '../../services/local-db/db';

const stages = ['Discovery', 'Demo', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await db.leads.toArray();
        setLeads(data);
      } catch (err) {
        console.error('Failed to load leads:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const filtered = leads.filter((l) => {
    const matchesStage = filter === 'all' || l.stage === filter;
    const matchesSearch = l.name?.toLowerCase().includes(search.toLowerCase()) || l.company?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase());
    return matchesStage && matchesSearch;
  });

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>Leads</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{leads.length} total leads</p>
        </div>
        <input
          type="text"
          placeholder="Search by name, company, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '10px 14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', width: '280px' }}
        />
      </div>

      {/* Stage Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: filter === 'all' ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: filter === 'all' ? 'var(--bg-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s' }}>
          All ({leads.length})
        </button>
        {stages.map((s) => {
          const count = leads.filter((l) => l.stage === s).length;
          return (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: filter === s ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: filter === s ? 'var(--bg-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s' }}>
              {s} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>{search || filter !== 'all' ? 'No leads match your filters' : 'No leads yet'}</p>
          <p style={{ fontSize: '13px' }}>{search || filter !== 'all' ? 'Try adjusting your search or filters' : 'Leads are auto-created from meeting participants.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {filtered.map((lead) => (
            <div key={lead.id} className="glass-card stat-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{lead.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{lead.role} at {lead.company}</p>
                </div>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: `2px solid ${getScoreColor(lead.score)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="data-text" style={{ fontSize: '14px', fontWeight: 700, color: getScoreColor(lead.score) }}>{lead.score}</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>{lead.email}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{lead.stage}</span>
                <span className="data-text" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
