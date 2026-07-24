import { db } from './local-db/db';
import { analyzeMeeting } from './ai/ai-service';
import { useStore } from '../store';
import { getSharedSocket } from '../hooks/useWebSocket';

class LeadAutomationService {
  private isSubscribed: boolean = false;

  async processMeetingLeads(meetingId: string, apiKey: string, model: string) {
    const transcriptData = await db.transcripts.where('meetingId').equals(meetingId).first();
    if (!transcriptData || !transcriptData.fullText) return;

    const existingAnalysis = await db.ai_analysis.where('meetingId').equals(meetingId).first();
    if (existingAnalysis) return;

    const result = await analyzeMeeting(transcriptData.fullText, meetingId, apiKey, model);

    await db.ai_analysis.put({
      id: `analysis_${meetingId}`,
      meetingId: meetingId,
      summary: result?.summary || result.analysis?.summary || '',
      actionItems: result?.actionItems || result.analysis?.actionItems || [],
      sentiment: result?.sentiment || result.analysis?.sentiment || { positive: 0, neutral: 0, negative: 0, overall: 'neutral' },
      leadScore: 0,
      emailDraft: null,
      modelUsed: model,
      analyzedAt: new Date().toISOString(),
    });
    
    const leads = result?.leads || result.analysis?.leads;
    if (!leads || leads.length === 0) return;

    const leadRecords = leads.map((lead: any, index: number) => ({
      id: `lead_${meetingId}_${index}_${Date.now()}`,
      meetingId: meetingId,
      name: lead.name || 'Unknown',
      email: lead.email || '',
      company: lead.company || 'Unknown',
      role: lead.role || 'Unknown',
      score: lead.score || 50,
      stage: lead.stage || 'Lead Identified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    await db.leads.bulkPut(leadRecords);
    console.log(`Successfully auto-generated ${leadRecords.length} leads.`);
  }

  handleMeetingEnded = async (data: { meetingId: string }) => {
    const { meetingId } = data;
    if (!meetingId) return;
    
    console.log(`Auto-processing meeting ${meetingId} for leads...`);
    
    const storeState = useStore.getState();
    const apiKey = storeState.geminiKey || storeState.openAiKey || storeState.anthropicKey;
    const model = storeState.geminiKey ? 'gemini' : storeState.openAiKey ? 'openai' : 'anthropic';
    
    if (!apiKey) {
      console.warn('Cannot auto-analyze meeting: No API key configured.');
      return;
    }

    try {
      await this.processMeetingLeads(meetingId, apiKey, model);
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed in auto-lead automation:', err);
      useStore.getState().setError(`Lead Automation Failed: ${errorMsg}`);
    }
  };

  handleParticipantJoined = async (data: { meetingId: string, participant: any }) => {
    const { meetingId, participant } = data;
    if (!meetingId || !participant) return;

    try {
      const existingLeads = await db.leads.where('meetingId').equals(meetingId).toArray();
      const alreadyExists = existingLeads.find(l => 
        (participant.email && l.email === participant.email) || 
        (participant.user_name && l.name === participant.user_name)
      );

      if (alreadyExists) return;

      const newLead = {
        id: `lead_${meetingId}_${participant.user_id || Date.now()}`,
        meetingId: meetingId,
        name: participant.user_name || 'Unknown Participant',
        email: participant.email || '',
        company: 'Unknown',
        role: 'Meeting Participant',
        score: 50,
        stage: 'Lead Identified',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await db.leads.add(newLead);
      console.log(`Auto-created lead from participant: ${newLead.name}`);
    } catch (err) {
      console.error('Failed to auto-create lead from participant:', err);
    }
  };

  start() {
    if (this.isSubscribed) return;
    
    const socket = getSharedSocket();
    if (socket) {
      socket.on('meeting_ended', this.handleMeetingEnded);
      socket.on('participant_joined', this.handleParticipantJoined);
      this.isSubscribed = true;
      console.log('Lead Automation Service started in background.');
    } else {
      console.warn('Lead Automation Service could not start: WebSocket not initialized.');
    }
  }

  stop() {
    if (!this.isSubscribed) return;
    
    const socket = getSharedSocket();
    if (socket) {
      socket.off('meeting_ended', this.handleMeetingEnded);
      socket.off('participant_joined', this.handleParticipantJoined);
    }
    this.isSubscribed = false;
    console.log('Lead Automation Service stopped.');
  }
}

export const leadAutomationService = new LeadAutomationService();
