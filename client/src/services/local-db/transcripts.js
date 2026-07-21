import { db } from './db';

export const transcriptsDB = {
  getByMeeting: (meetingId) => db.transcripts.where('meetingId').equals(meetingId).first(),
  put: (transcript) => db.transcripts.put(transcript),
  delete: (id) => db.transcripts.delete(id),
};
