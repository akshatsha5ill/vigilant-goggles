import Dexie from 'dexie';

export const db = new Dexie('DealForgeDB');

db.version(1).stores({
  meetings: 'id, zoomMeetingId, title, startTime, endTime, duration, status',
  transcripts: 'id, meetingId, createdAt',
  ai_analysis: 'id, meetingId, leadScore, analyzedAt',
  leads: 'id, meetingId, name, email, company, role, score, stage, createdAt',
  deals: 'id, leadId, title, stage, value, probability, expectedClose, createdAt',
  email_campaigns: 'id, leadId, subject, status, type, scheduledAt, sentAt',
  email_tracking: 'id, campaignId, opens, clicks, replied, lastActivity'
});
