import { db } from './db';
import { meetingsDB } from './meetings';
import { leadsDB } from './leads';
import { dealsDB } from './deals';
import { emailsDB } from './emails';
import { trackingDB } from './tracking';
import { Meeting, Transcript, Analysis, Lead, Deal, EmailCampaign, EmailTracking } from '../../types';

export interface BackupData {
  meetings?: Meeting[];
  transcripts?: Transcript[];
  aiAnalysis?: Analysis[];
  leads?: Lead[];
  deals?: Deal[];
  emails?: EmailCampaign[];
  tracking?: EmailTracking[];
  exportedAt?: string;
}

export const exportAllData = async (): Promise<BackupData> => {
  const [meetings, transcripts, aiAnalysis, leads, deals, emails, tracking] = await Promise.all([
    meetingsDB.getAll(),
    db.transcripts.toArray(),
    db.ai_analysis.toArray(),
    leadsDB.getAll(),
    dealsDB.getAll(),
    emailsDB.getAll(),
    trackingDB.getAll(),
  ]);
  return { meetings, transcripts, aiAnalysis, leads, deals, emails, tracking, exportedAt: new Date().toISOString() };
};

export const importData = async (data: BackupData): Promise<void> => {
  if (data.meetings) await db.meetings.bulkPut(data.meetings);
  if (data.transcripts) await db.transcripts.bulkPut(data.transcripts);
  if (data.aiAnalysis) await db.ai_analysis.bulkPut(data.aiAnalysis);
  if (data.leads) await db.leads.bulkPut(data.leads);
  if (data.deals) await db.deals.bulkPut(data.deals);
  if (data.emails) await db.email_campaigns.bulkPut(data.emails);
  if (data.tracking) await db.email_tracking.bulkPut(data.tracking);
};

export const downloadJSON = (data: BackupData, filename = `meetflow-backup-${new Date().toISOString().split('T')[0]}.json`): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export interface StorageUsage {
  used: number;
  quota: number;
  percent: string;
}

export const getStorageUsage = async (): Promise<StorageUsage | null> => {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return { used: estimate.usage, quota: estimate.quota, percent: ((estimate.usage / estimate.quota) * 100).toFixed(1) };
  }
  return null;
};

export const requestPersistence = async (): Promise<boolean> => {
  if (navigator.storage && navigator.storage.persist) {
    return navigator.storage.persist();
  }
  return false;
};
