import { db } from './db';
import { EmailTracking } from '../../types';

export const trackingDB = {
  getAll: (): Promise<EmailTracking[]> => db.email_tracking.toArray(),
  get: (id: string): Promise<EmailTracking | undefined> => db.email_tracking.get(id),
  getByCampaign: (campaignId: string): Promise<EmailTracking | undefined> => db.email_tracking.where('campaignId').equals(campaignId).first(),
  put: (tracking: EmailTracking): Promise<string> => db.email_tracking.put(tracking),
  delete: (id: string): Promise<void> => db.email_tracking.delete(id),
};
