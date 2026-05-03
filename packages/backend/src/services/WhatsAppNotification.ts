// WhatsApp Notification Service — Poonawalla Fincorp LoanWizard OS
// Mock implementation — replace with actual WhatsApp Business API in production

import { logger } from '../lib/logger';

export interface WhatsAppResponse {
  messageId: string;
  status: 'sent' | 'failed';
  timestamp: string;
  to: string;
}

interface LoanOfferSummary {
  amount: number;
  rate_pa: number;
  emi: number;
  tenure_months: number;
}

function generateMessageId(): string {
  return 'wamid.' + Math.random().toString(36).slice(2, 18).toUpperCase();
}

function maskPhone(phone: string): string {
  return phone.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2');
}

export class WhatsAppNotification {
  /**
   * Send OTP message via WhatsApp
   */
  static async sendOTPMessage(phone: string, otp: string): Promise<WhatsAppResponse> {
    const messageId = generateMessageId();
    const message = `Your Finsa OTP is *${otp}*. Valid for 10 minutes. Do NOT share with anyone.\n\n_Poonawalla Fincorp_`;

    logger.info({
      event: 'whatsapp_otp_sent',
      to: maskPhone(phone),
      message_id: messageId,
      // OTP intentionally not logged
    });

    // Mock: simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      messageId,
      status: 'sent',
      timestamp: new Date().toISOString(),
      to: phone,
    };
  }

  /**
   * Send loan offer notification
   */
  static async sendOfferNotification(
    phone: string,
    offer: LoanOfferSummary
  ): Promise<WhatsAppResponse> {
    const messageId = generateMessageId();
    const formatINR = (n: number) =>
      new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    const message = [
      `🎉 *Congratulations! Your loan offer is ready.*`,
      ``,
      `💰 *Loan Amount:* ${formatINR(offer.amount)}`,
      `📊 *Interest Rate:* ${offer.rate_pa}% p.a.`,
      `📅 *Monthly EMI:* ${formatINR(offer.emi)} for ${offer.tenure_months} months`,
      ``,
      `✅ Accept your offer now: https://finsa.poonawallafincorp.com/offer`,
      ``,
      `_Poonawalla Fincorp | RBI Licensed NBFC_`,
      `_To opt out, reply STOP_`,
    ].join('\n');

    logger.info({
      event: 'whatsapp_offer_sent',
      to: maskPhone(phone),
      message_id: messageId,
      offer_amount: offer.amount,
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      messageId,
      status: 'sent',
      timestamp: new Date().toISOString(),
      to: phone,
    };
  }

  /**
   * Send session/campaign link
   */
  static async sendSessionLink(phone: string, sessionUrl: string): Promise<WhatsAppResponse> {
    const messageId = generateMessageId();

    const message = [
      `Hi! You've been pre-approved for a personal loan from *Poonawalla Fincorp*.`,
      ``,
      `🚀 Complete your application in just *3 minutes* via a quick video call:`,
      `👉 ${sessionUrl}`,
      ``,
      `✨ No branch visit needed | Instant approval | Rates from 9.99% p.a.`,
      ``,
      `_Link valid for 24 hours. Poonawalla Fincorp | RBI Licensed NBFC_`,
    ].join('\n');

    logger.info({
      event: 'whatsapp_session_link_sent',
      to: maskPhone(phone),
      message_id: messageId,
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      messageId,
      status: 'sent',
      timestamp: new Date().toISOString(),
      to: phone,
    };
  }

  /**
   * Send rejection message with appeal information
   */
  static async sendRejectionMessage(phone: string, reason: string): Promise<WhatsAppResponse> {
    const messageId = generateMessageId();

    const message = [
      `We regret to inform you that your loan application could not be processed at this time.`,
      ``,
      `*Reason:* ${reason}`,
      ``,
      `📞 *Appeal Process:*`,
      `If you believe this decision is incorrect, you may appeal within 30 days:`,
      `• Call: 1800-266-3201 (Toll Free)`,
      `• Email: grievance@poonawallafincorp.com`,
      `• Visit: www.poonawallafincorp.com/grievance`,
      ``,
      `You may re-apply after 90 days once the issue is resolved.`,
      ``,
      `_Poonawalla Fincorp | RBI Licensed NBFC_`,
    ].join('\n');

    logger.info({
      event: 'whatsapp_rejection_sent',
      to: maskPhone(phone),
      message_id: messageId,
      reason,
    });

    await new Promise(resolve => setTimeout(resolve, 50));

    return {
      messageId,
      status: 'sent',
      timestamp: new Date().toISOString(),
      to: phone,
    };
  }
}
