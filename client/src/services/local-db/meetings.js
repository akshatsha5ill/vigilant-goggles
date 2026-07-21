import { db } from './db';

export const meetingsDB = {
  getAll: () => db.meetings.toArray(),
  get: (id) => db.meetings.get(id),
  getByZoomId: (zoomMeetingId) => db.meetings.where('zoomMeetingId').equals(zoomMeetingId).first(),
  put: (meeting) => db.meetings.put(meeting),
  bulkPut: (meetings) => db.meetings.bulkPut(meetings),
  delete: (id) => db.meetings.delete(id),
  count: () => db.meetings.count(),
};
