import { useState, useEffect } from 'react';
import { db } from '../../services/local-db/db';
import { mockLeads } from '../../utils/mockData';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const fetchLeads = async () => {
      const data = await db.leads.toArray();
      setLeads(data);
    };
    fetchLeads();
  }, []);

  const populateMockData = async () => {
    await db.leads.bulkPut(mockLeads);
    const data = await db.leads.toArray();
    setLeads(data);
  };

  return (
    <div>
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>Leads</h1>
      <button onClick={populateMockData} style={{ padding: '8px 16px', marginBottom: '20px', backgroundColor: 'var(--accent-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Populate Mock Data</button>
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {leads.map((lead) => (
          <div key={lead.id} className="glass-card" style={{ padding: '20px', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }} onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}} onMouseLeave={(e) => {e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'}}>
            <h3 style={{ margin: '0 0 10px 0' }}>{lead.name}</h3>
            <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}><span className="data-text">{lead.role}</span> at {lead.company}</p>
            <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>{lead.email}</p>
            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ backgroundColor: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{lead.stage}</span>
              <span style={{ color: lead.score > 80 ? 'var(--success)' : 'var(--warning)', fontWeight: 'bold' }}><span className="data-text">Score: {lead.score}</span></span>
            </div>
          </div>
        ))}
      </div>
      {leads.length === 0 && <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>No leads found.</p>}
    </div>
  );
}
