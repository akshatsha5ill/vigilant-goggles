import express, { Request, Response } from 'express';
import crypto from 'crypto';
import https from 'https';
import bufferService from '../services/buffer-service.js';
import { verifyAuth } from '../middleware/auth.js';
import { config } from '../config.js';
import { z } from 'zod';
import { validateRequest } from 'zod-express-middleware';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

router.get('/oauth/callback', async (req: Request, res: Response, next: express.NextFunction): Promise<any> => {
  const { code } = req.query;
  if (!code) {
    return next(new AppError('Missing authorization code', 400));
  }

  const { clientId, clientSecret, redirectUri } = config.zoom;
  if (!clientId || !clientSecret) {
    return next(new AppError('Zoom OAuth not configured', 500));
  }

  try {
    const tokenRes: any = await new Promise((resolve, reject) => {
      const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
      }).toString();

      const reqOpts = {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${creds}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const request = https.request('https://zoom.us/oauth/token', reqOpts, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error('Failed to parse token response')); }
        });
      });
      request.on('error', reject);
      request.write(body);
      request.end();
    });

    if (tokenRes.error) {
      return next(new AppError(tokenRes.reason || tokenRes.error, 400));
    }

    return res.json({
      status: 'success',
      expires_in: tokenRes.expires_in,
    });
  } catch (err) {
    return next(new AppError('Token exchange failed', 500));
  }
});

router.post('/webhook', (req: Request, res: Response, next: express.NextFunction): any => {
  const { event, payload } = req.body;
  const secret = config.zoom.webhookSecretToken;

  if (!secret) {
     return next(new AppError('Server configuration error', 500));
  }

  const zoomSignature = req.headers['x-zm-signature'] as string;
  const zoomTimestamp = req.headers['x-zm-request-timestamp'] as string;

  if (!zoomSignature || !zoomTimestamp) {
    return next(new AppError('Unauthorized: Missing signature', 401));
  }

  const message = `v0:${zoomTimestamp}:${JSON.stringify(req.body)}`;
  const hashForVerify = crypto.createHmac('sha256', secret).update(message).digest('hex');
  const signature = `v0=${hashForVerify}`;

  const bufSig = Buffer.from(signature);
  const bufZoom = Buffer.from(zoomSignature);

  if (bufSig.length !== bufZoom.length || !crypto.timingSafeEqual(bufSig, bufZoom)) {
    return next(new AppError('Unauthorized: Invalid signature', 401));
  }

  switch (event) {
    case 'endpoint.url_validation': {
      const hashForValidate = crypto.createHmac('sha256', secret).update(payload.plainToken).digest('hex');
      return res.status(200).json({
        plainToken: payload.plainToken,
        encryptedToken: hashForValidate
      });
    }
    case 'meeting.started': {
      const meetingId = payload?.object?.id;
      if (meetingId) {
        bufferService.store(`meeting:${meetingId}`, { startedAt: new Date().toISOString(), status: 'active' });
      }
      break;
    }
    case 'meeting.ended': {
      const meetingId = payload?.object?.id;
      if (meetingId) {
        const data = bufferService.get(`meeting:${meetingId}`);
        if (data) {
          data.endedAt = new Date().toISOString();
          data.status = 'completed';
          bufferService.store(`meeting:${meetingId}`, data);
        }
        const io = req.app.get('io');
        if (io) {
          io.to(`meeting:${meetingId}`).emit('meeting_ended', { meetingId });
          io.emit('meeting_ended', { meetingId });
        }
      }
      break;
    }
  }

  return res.status(200).json({ status: 'ok' });
});

const transcriptionSchema = z.object({
  meetingId: z.string().min(1),
  segment: z.any() // Could be typed more strictly
});

router.post('/transcription', verifyAuth, validateRequest({ body: transcriptionSchema }), (req: Request, res: Response, next: express.NextFunction): any => {
  const { meetingId, segment } = req.body;

  const key = `transcript:${meetingId}`;
  const existing = bufferService.get(key) || { segments: [] };
  existing.segments.push(segment);
  bufferService.store(key, existing);

  const io = req.app.get('io');
  if (io) {
    io.to(`meeting:${meetingId}`).emit('transcription', segment);
  }

  return res.status(200).json({ status: 'ok' });
});

const notesSchema = z.object({
  meetingId: z.string().min(1),
  note: z.any()
});

router.post('/notes', verifyAuth, validateRequest({ body: notesSchema }), (req: Request, res: Response, next: express.NextFunction): any => {
  const { meetingId, note } = req.body;

  const key = `notes:${meetingId}`;
  const existing = bufferService.get(key) || { notes: [] };
  existing.notes.push({ ...note, receivedAt: new Date().toISOString() });
  bufferService.store(key, existing);

  return res.status(200).json({ status: 'ok' });
});

router.get('/buffer/:meetingId', verifyAuth, (req: Request, res: Response) => {
  const { meetingId } = req.params;
  const transcript = bufferService.get(`transcript:${meetingId}`);
  const notes = bufferService.get(`notes:${meetingId}`);
  const meetingData = bufferService.get(`meeting:${meetingId}`);

  res.status(200).json({
    transcript: transcript || null,
    notes: notes || null,
    meeting: meetingData || null,
  });
});

router.delete('/buffer/:meetingId', verifyAuth, (req: Request, res: Response) => {
  const { meetingId } = req.params;
  bufferService.buffer.delete(`transcript:${meetingId}`);
  bufferService.buffer.delete(`notes:${meetingId}`);
  bufferService.buffer.delete(`meeting:${meetingId}`);
  res.status(200).json({ status: 'cleared' });
});

export default router;
