import { db } from './db';
import { Lead } from '../../types';

export const leadsDB = {
  getAll: (): Promise<Lead[]> => db.leads.toArray(),
  get: (id: string): Promise<Lead | undefined> => db.leads.get(id),
  getByMeeting: (meetingId: string): Promise<Lead[]> => db.leads.where('meetingId').equals(meetingId).toArray(),
  getByStage: (stage: string): Promise<Lead[]> => db.leads.where('stage').equals(stage).toArray(),
  put: (lead: Lead): Promise<string> => db.leads.put(lead),
  bulkPut: (leads: Lead[]): Promise<string> => db.leads.bulkPut(leads),
  delete: (id: string): Promise<void> => db.leads.delete(id),
  count: (): Promise<number> => db.leads.count(),
  
  createLeadsFromAnalysis: async (meetingId: string, analyzedLeads: any[]): Promise<number> => {
    if (!analyzedLeads || analyzedLeads.length === 0) return 0;
    
    const leadRecords: Lead[] = analyzedLeads.map((lead, index) => ({
      id: `lead_${meetingId}_${index}_${Date.now()}`,
      meetingId,
      name: lead.name || 'Unknown',
      email: lead.email || '',
      company: lead.company || 'Unknown',
      role: lead.role || 'Unknown',
      score: lead.score || 50,
      stage: lead.stage || 'Lead Identified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    await db.leads.bulkPut(leadRecords);
    return leadRecords.length;
  }
};
