import Dexie, { Table } from 'dexie';
import { Meeting, Transcript, Analysis, Lead, Deal, EmailCampaign, EmailTracking, DripCampaign, Setting } from '../../types';

export class DealForgeDatabase extends Dexie {
  meetings!: Table<Meeting, string>;
  transcripts!: Table<Transcript, string>;
  ai_analysis!: Table<Analysis, string>;
  leads!: Table<Lead, string>;
  deals!: Table<Deal, string>;
  email_campaigns!: Table<EmailCampaign, string>;
  email_tracking!: Table<EmailTracking, string>;
  settings!: Table<Setting, string>;
  drip_campaigns!: Table<DripCampaign, string>;

  constructor() {
    super('DealForgeDB');

    this.version(1).stores({
      meetings: 'id, zoomMeetingId, title, startTime, endTime, duration, status',
      transcripts: 'id, meetingId, createdAt',
      ai_analysis: 'id, meetingId, leadScore, analyzedAt',
      leads: 'id, meetingId, name, email, company, role, score, stage, createdAt',
      deals: 'id, leadId, title, stage, value, probability, expectedClose, createdAt',
      email_campaigns: 'id, leadId, subject, status, type, scheduledAt, sentAt',
      email_tracking: 'id, campaignId, opens, clicks, replied, lastActivity'
    });

    this.version(2).stores({
      meetings: 'id, zoomMeetingId, title, startTime, endTime, duration, status, [status+startTime]',
      leads: 'id, meetingId, name, email, company, role, score, stage, createdAt, [stage+createdAt]',
      settings: 'key'
    }).upgrade(tx => {
      // Indexes added, no data migration needed
    });

    this.version(3).stores({
      drip_campaigns: 'id, leadId, name, status, currentStep, nextRunAt, createdAt'
    }).upgrade(tx => {
    });

    // Version 4: Optimize indexes by removing bloated/unused indexes 
    // to improve write performance and reduce storage footprint.
    this.version(4).stores({
      meetings: 'id, zoomMeetingId, startTime, status, [status+startTime]',
      transcripts: 'id, meetingId',
      ai_analysis: 'id, meetingId',
      leads: 'id, meetingId, stage, createdAt, [stage+createdAt]',
      deals: 'id, leadId, stage',
      email_campaigns: 'id, leadId, status',
      email_tracking: 'id, campaignId',
      drip_campaigns: 'id, leadId, status'
    }).upgrade(tx => {
      // Dropping unneeded indexes to optimize writes and storage size
    });
  }
}

export const db = new DealForgeDatabase();
