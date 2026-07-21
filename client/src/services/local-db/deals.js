import { db } from './db';

export const dealsDB = {
  getAll: () => db.deals.toArray(),
  get: (id) => db.deals.get(id),
  getByLead: (leadId) => db.deals.where('leadId').equals(leadId).toArray(),
  getByStage: (stage) => db.deals.where('stage').equals(stage).toArray(),
  put: (deal) => db.deals.put(deal),
  bulkPut: (deals) => db.deals.bulkPut(deals),
  delete: (id) => db.deals.delete(id),
  count: () => db.deals.count(),
};
