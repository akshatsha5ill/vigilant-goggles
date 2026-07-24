export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface DateItem {
  createdAt?: string;
  startTime?: string;
  sentAt?: string;
  scheduledAt?: string;
  [key: string]: any;
}

export function filterByDate<T extends DateItem>(items: T[], days: number): T[] {
  const cutoff = Date.now() - days * 86400000;
  return items.filter((item) => {
    const ts = new Date(item.createdAt || item.startTime || item.sentAt || item.scheduledAt || Date.now()).getTime();
    return ts >= cutoff;
  });
}

export interface MeetingData {
  startTime: string;
  [key: string]: any;
}

export function buildMeetingTrendData(meetings: MeetingData[]) {
  const counts: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };
  for (const m of meetings) {
    const d = new Date(m.startTime);
    const day = DAY_NAMES[d.getDay()];
    if (day in counts) counts[day]++;
  }
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((name) => ({ name, meetings: counts[name] }));
}

export interface DealData {
  stage?: string;
  value?: number;
  [key: string]: any;
}

export function buildPipelineData(deals: DealData[]) {
  const stages: Record<string, number> = {};
  for (const d of deals) {
    const key = d.stage || 'Unknown';
    stages[key] = (stages[key] || 0) + (d.value || 0);
  }
  return Object.entries(stages).map(([name, value]) => ({ name, value }));
}

export interface LeadData {
  stage?: string;
  [key: string]: any;
}

export function buildLeadStageData(leads: LeadData[]) {
  const stages: Record<string, number> = {};
  for (const l of leads) {
    const key = l.stage || 'Unknown';
    stages[key] = (stages[key] || 0) + 1;
  }
  return Object.entries(stages).map(([name, value]) => ({ name, value }));
}

export interface EmailItem {
  status?: string;
  [key: string]: any;
}

export function buildEmailData(emails: EmailItem[]) {
  const statuses: Record<string, number> = {};
  for (const e of emails) {
    const key = e.status || 'Unknown';
    statuses[key] = (statuses[key] || 0) + 1;
  }
  return Object.entries(statuses).map(([name, count]) => ({ name, count }));
}
