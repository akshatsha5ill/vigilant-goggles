import { db } from './db';
import { Transcript } from '../../types';

export const transcriptsDB = {
  getByMeeting: (meetingId: string): Promise<Transcript | undefined> => db.transcripts.where('meetingId').equals(meetingId).first(),
  put: (transcript: Transcript): Promise<string> => db.transcripts.put(transcript),
  delete: (id: string): Promise<void> => db.transcripts.delete(id),
};
