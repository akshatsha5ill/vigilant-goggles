import { db } from './db';

export const aiAnalysisDB = {
  getByMeeting: (meetingId) => db.ai_analysis.where('meetingId').equals(meetingId).first(),
  put: (analysis) => db.ai_analysis.put(analysis),
  delete: (id) => db.ai_analysis.delete(id),
};
