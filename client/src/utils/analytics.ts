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

export function calculatePipelineVelocity(deals: DealData[]) {
  if (deals.length === 0) return { velocity: 0, avgSalesCycle: 0, winRate: 0 };
  
  const wonDeals = deals.filter(d => d.stage === 'closed_won');
  const winRate = wonDeals.length / deals.length;
  
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const avgDealSize = totalValue / deals.length;
  
  let totalCycleDays = 0;
  let cycleCount = 0;
  
  for (const d of wonDeals) {
    if (d.createdAt && d.updatedAt) {
      const start = new Date(d.createdAt).getTime();
      const end = new Date(d.updatedAt).getTime();
      const diffDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24)); // Minimum 1 day
      totalCycleDays += diffDays;
      cycleCount++;
    }
  }
  
  const avgSalesCycle = cycleCount > 0 ? (totalCycleDays / cycleCount) : 30; // default 30 days if no reliable data
  
  const velocity = (deals.length * winRate * avgDealSize) / avgSalesCycle;
  return { velocity, avgSalesCycle, winRate: winRate * 100 };
}

export function buildMeetingFrequencyData(meetings: MeetingData[], days: number) {
   const data: Record<string, number> = {};
   const now = new Date();
   
   // Initialize buckets for the chart
   const step = days > 30 ? Math.ceil(days / 15) : 1; // Group by multiple days if range is large
   
   for (let i = days - 1; i >= 0; i -= step) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      data[key] = 0;
   }
   
   for (const m of meetings) {
      const d = new Date(m.startTime);
      // Find the closest bucket
      for (let i = days - 1; i >= 0; i -= step) {
         const bucketDate = new Date(now.getTime() - i * 86400000);
         // If same day or within step
         const diffTime = Math.abs(d.getTime() - bucketDate.getTime());
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
         if (diffDays <= step) {
             const key = `${bucketDate.getMonth() + 1}/${bucketDate.getDate()}`;
             if (data[key] !== undefined) {
                 data[key]++;
                 break;
             }
         }
      }
   }
   
   // Simpler exact matching if step == 1
   if (step === 1) {
     for (const key in data) data[key] = 0;
     for (const m of meetings) {
       const d = new Date(m.startTime);
       const key = `${d.getMonth() + 1}/${d.getDate()}`;
       if (data[key] !== undefined) data[key]++;
     }
   }

   return Object.entries(data).map(([date, count]) => ({ date, count }));
}
