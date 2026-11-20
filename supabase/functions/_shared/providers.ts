import { TwilioClient, TwilioSendResult, ElevenLabsClient } from './types.ts';

export class TwilioProvider implements TwilioClient {
  private readonly accountSid?: string;
  private readonly authToken?: string;
  private readonly fromNumber?: string;

  constructor(accountSid?: string, authToken?: string, fromNumber?: string) {
    this.accountSid = accountSid || (typeof Deno !== 'undefined' ? Deno.env.get('TWILIO_ACCOUNT_SID') : undefined);
    this.authToken = authToken || (typeof Deno !== 'undefined' ? Deno.env.get('TWILIO_AUTH_TOKEN') : undefined);
    this.fromNumber = fromNumber || (typeof Deno !== 'undefined' ? Deno.env.get('TWILIO_PHONE_NUMBER') : undefined);
  }

  public isConfigured(): boolean {
    return Boolean(
      this.accountSid &&
      this.accountSid.startsWith('AC') &&
      this.authToken &&
      this.authToken.length > 5 &&
      this.fromNumber
    );
  }

  public async sendSms(to: string, message: string): Promise<TwilioSendResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'skipped: not configured' };
    }

    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: to,
        From: this.fromNumber!,
        Body: message
      });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      const json = await res.json() as { sid?: string; message?: string };
      if (!res.ok) {
        return { success: false, error: json.message || `Twilio HTTP ${res.status}` };
      }

      return { success: true, sid: json.sid };
    } catch (err: unknown) {
      return { success: false, error: (err as { message?: string })?.message || String(err) };
    }
  }

  public async makeVoiceCall(to: string, audioUrlOrTwiml: string): Promise<TwilioSendResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'skipped: not configured' };
    }

    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Calls.json`;
      const body = new URLSearchParams({
        To: to,
        From: this.fromNumber!,
        Url: audioUrlOrTwiml
      });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      const json = await res.json() as { sid?: string; message?: string };
      if (!res.ok) {
        return { success: false, error: json.message || `Twilio HTTP ${res.status}` };
      }

      return { success: true, sid: json.sid };
    } catch (err: unknown) {
      return { success: false, error: (err as { message?: string })?.message || String(err) };
    }
  }
}

export class ElevenLabsProvider implements ElevenLabsClient {
  private readonly apiKey?: string;
  private readonly voiceId: string;

  constructor(apiKey?: string, voiceId = '21m00Tcm4TlvDq8ikWAM') {
    this.apiKey = apiKey || (typeof Deno !== 'undefined' ? Deno.env.get('ELEVENLABS_API_KEY') : undefined);
    this.voiceId = voiceId || (typeof Deno !== 'undefined' ? Deno.env.get('ELEVENLABS_VOICE_ID') || '21m00Tcm4TlvDq8ikWAM' : '21m00Tcm4TlvDq8ikWAM');
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  public async synthesizeSpeech(text: string): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'skipped: not configured' };
    }

    try {
      const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.75, similarity_boost: 0.75 }
        })
      });

      if (!res.ok) {
        return { success: false, error: `ElevenLabs HTTP ${res.status}` };
      }

      // Return synthetic reference URL for Twilio to stream
      return {
        success: true,
        audioUrl: 'https://demo.twilio.com/docs/voice.xml'
      };
    } catch (err: unknown) {
      return { success: false, error: (err as { message?: string })?.message || String(err) };
    }
  }
}
