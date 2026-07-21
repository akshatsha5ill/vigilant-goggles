import { db } from './db';

export const leadsDB = {
  getAll: () => db.leads.toArray(),
  get: (id) => db.leads.get(id),
  getByMeeting: (meetingId) => db.leads.where('meetingId').equals(meetingId).toArray(),
  getByStage: (stage) => db.leads.where('stage').equals(stage).toArray(),
  put: (lead) => db.leads.put(lead),
  bulkPut: (leads) => db.leads.bulkPut(leads),
  delete: (id) => db.leads.delete(id),
  count: () => db.leads.count(),
};
