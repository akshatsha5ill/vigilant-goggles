import { db } from './db';
import { EmailCampaign } from '../../types';

export const emailsDB = {
  getAll: (): Promise<EmailCampaign[]> => db.email_campaigns.toArray(),
  get: (id: string): Promise<EmailCampaign | undefined> => db.email_campaigns.get(id),
  getByLead: (leadId: string): Promise<EmailCampaign[]> => db.email_campaigns.where('leadId').equals(leadId).toArray(),
  put: (campaign: EmailCampaign): Promise<string> => db.email_campaigns.put(campaign),
  bulkPut: (campaigns: EmailCampaign[]): Promise<string> => db.email_campaigns.bulkPut(campaigns),
  delete: (id: string): Promise<void> => db.email_campaigns.delete(id),
};
