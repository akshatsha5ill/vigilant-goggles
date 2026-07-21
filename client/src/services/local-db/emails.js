import { db } from './db';

export const emailsDB = {
  getAll: () => db.email_campaigns.toArray(),
  get: (id) => db.email_campaigns.get(id),
  getByLead: (leadId) => db.email_campaigns.where('leadId').equals(leadId).toArray(),
  put: (campaign) => db.email_campaigns.put(campaign),
  bulkPut: (campaigns) => db.email_campaigns.bulkPut(campaigns),
  delete: (id) => db.email_campaigns.delete(id),
};
