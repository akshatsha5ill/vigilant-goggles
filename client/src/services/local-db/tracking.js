import { db } from './db';

export const trackingDB = {
  getAll: () => db.email_tracking.toArray(),
  get: (id) => db.email_tracking.get(id),
  getByCampaign: (campaignId) => db.email_tracking.where('campaignId').equals(campaignId).first(),
  put: (tracking) => db.email_tracking.put(tracking),
  delete: (id) => db.email_tracking.delete(id),
};
