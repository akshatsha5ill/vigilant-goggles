import { db } from './local-db/db';
import { sendEmail, generateEmailDraft } from './ai/ai-service';
import { useStore } from '../store';

const ONE_DAY_MS = 86400000;
const ONE_HOUR_MS = 3600000;
const CHECK_INTERVAL_MS = 60000;

class DripCampaignWorker {
  private isRunning: boolean = false;
  private intervalId: any = null;

  async processCampaignStep(campaign: any, now: number) {
    if (!campaign.nextRunAt || campaign.nextRunAt > now) return;

    console.log(`Processing drip campaign ${campaign.id} for lead ${campaign.leadId}`);
    
    const lead = await db.leads.get(campaign.leadId);
    if (!lead || !lead.email) {
      await db.drip_campaigns.update(campaign.id, { status: 'error', error: 'Lead not found or no email' });
      return;
    }

    const storeState = useStore.getState();
    const aiKey = storeState.openAiKey || storeState.anthropicKey || storeState.geminiKey;
    const aiModel = storeState.openAiKey ? 'openai' : storeState.anthropicKey ? 'anthropic' : 'gemini';
    const emailKey = storeState.resendKey;
    
    if (!aiKey || !emailKey) {
       console.error(`Missing API Keys for AI or Email generation for campaign ${campaign.id}`);
       useStore.getState().setError(`Drip Campaign Failed: Missing API Keys.`);
       await db.drip_campaigns.update(campaign.id, { nextRunAt: now + ONE_HOUR_MS });
       return;
    }

    try {
      let transcriptContext = '';
      try {
        const transcripts = await db.transcripts.toArray();
        const leadMeetings = await db.meetings.toArray();
        const meetingForLead = leadMeetings.find(m => transcripts.some(t => t.meetingId === m.id));
        if (meetingForLead) {
          const transcript = transcripts.find(t => t.meetingId === meetingForLead.id);
          transcriptContext = transcript?.content || transcript?.text || transcript?.fullText || '';
        }
      } catch (err) {
        console.error("Failed to load transcript for drip worker", err);
      }

      const res = await generateEmailDraft(transcriptContext, lead, aiKey, aiModel);
      const data = await res.json();
      
      const subject = data?.draft?.subject || data?.subject || `${campaign.name} - Follow up`;
      const body = data?.draft?.body || data?.draft?.content || data?.body || data?.content || `Hi ${lead.name},\n\nJust following up on our recent meeting. Let me know if you have any questions!\n\nBest,`;
      
      await sendEmail(lead.email, subject, body, emailKey);
      
      await db.email_campaigns.put({
        id: crypto.randomUUID(),
        leadId: lead.id,
        subject,
        body,
        status: 'sent',
        type: 'drip_step',
        sentAt: new Date(now).toISOString(),
        scheduledAt: new Date(now).toISOString(),
        sequence: [],
      });

      const isLastStep = campaign.currentStep >= 2;
      await db.drip_campaigns.update(campaign.id, { 
        status: isLastStep ? 'completed' : 'active',
        currentStep: campaign.currentStep + 1, 
        nextRunAt: isLastStep ? null : now + ONE_DAY_MS 
      });
    } catch (err) {
      console.error(`Failed to send drip step for campaign ${campaign.id}:`, err);
      await db.drip_campaigns.update(campaign.id, { nextRunAt: now + ONE_HOUR_MS });
    }
  }

  start() {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(async () => {
      if (this.isRunning) return;
      this.isRunning = true;
      
      try {
        const now = Date.now();
        const activeCampaigns = await db.drip_campaigns.where('status').equals('active').toArray();
        
        for (const campaign of activeCampaigns) {
          await this.processCampaignStep(campaign, now);
        }
      } catch (err) {
        console.error('Drip worker error:', err);
      } finally {
        this.isRunning = false;
      }
    }, CHECK_INTERVAL_MS);
    
    console.log('Drip Campaign Worker started in background.');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Drip Campaign Worker stopped.');
    }
  }
}

export const dripWorker = new DripCampaignWorker();
