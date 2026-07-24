import { db } from './db';
import { Analysis } from '../../types';

export const aiAnalysisDB = {
  getByMeeting: (meetingId: string): Promise<Analysis | undefined> => db.ai_analysis.where('meetingId').equals(meetingId).first(),
  put: (analysis: Analysis): Promise<string> => db.ai_analysis.put(analysis),
  delete: (id: string): Promise<void> => db.ai_analysis.delete(id),
};
