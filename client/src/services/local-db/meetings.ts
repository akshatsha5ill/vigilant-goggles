import { db } from './db';
import { Meeting } from '../../types';

export const meetingsDB = {
  getAll: (): Promise<Meeting[]> => db.meetings.toArray(),
  get: (id: string): Promise<Meeting | undefined> => db.meetings.get(id),
  getByZoomId: (zoomMeetingId: string): Promise<Meeting | undefined> => db.meetings.where('zoomMeetingId').equals(zoomMeetingId).first(),
  put: (meeting: Meeting): Promise<string> => db.meetings.put(meeting),
  bulkPut: (meetings: Meeting[]): Promise<string> => db.meetings.bulkPut(meetings),
  delete: (id: string): Promise<void> => db.meetings.delete(id),
  count: (): Promise<number> => db.meetings.count(),
};
