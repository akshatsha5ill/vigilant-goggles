import { db } from './db';
import { Deal } from '../../types';

export const dealsDB = {
  getAll: (): Promise<Deal[]> => db.deals.toArray(),
  get: (id: string): Promise<Deal | undefined> => db.deals.get(id),
  getByLead: (leadId: string): Promise<Deal[]> => db.deals.where('leadId').equals(leadId).toArray(),
  getByStage: (stage: string): Promise<Deal[]> => db.deals.where('stage').equals(stage).toArray(),
  put: (deal: Deal): Promise<string> => db.deals.put(deal),
  bulkPut: (deals: Deal[]): Promise<string> => db.deals.bulkPut(deals),
  delete: (id: string): Promise<void> => db.deals.delete(id),
  count: (): Promise<number> => db.deals.count(),
};
