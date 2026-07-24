export interface Meeting {
  id: string;
  zoomMeetingId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: string;
}

export interface Transcript {
  id: string;
  meetingId: string;
  segments: any[]; 
  fullText: string;
  createdAt: Date;
}

export interface Analysis {
  id: string;
  meetingId: string;
  summary: string;
  actionItems: string[];
  sentiment: any;
  leadScore: number;
  emailDraft: any;
  modelUsed: string;
  analyzedAt: Date;
}

export interface Lead {
  id: string;
  meetingId: string;
  name: string;
  email: string;
  company: string;
  role: string;
  score: number;
  stage: string;
  tags?: string[];
  customFields?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  leadId: string;
  title: string;
  stage: string;
  value: number;
  probability: number;
  expectedClose: Date;
  notes: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailCampaign {
  id: string;
  leadId: string;
  subject: string;
  body: string;
  status: string;
  type: string;
  sequence: any[];
  scheduledAt: Date;
  sentAt?: Date;
}

export interface EmailTracking {
  id: string;
  campaignId: string;
  opens: number;
  clicks: number;
  replied: boolean;
  lastActivity: Date;
}
