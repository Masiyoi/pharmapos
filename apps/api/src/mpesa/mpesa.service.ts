import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);
  private readonly consumerKey: string;
  private readonly consumerSecret: string;
  private readonly shortcode: string;
  private readonly passkey: string;
  private readonly callbackUrl: string;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    // Read at construction time with process.env fallback
    this.consumerKey = config.get('MPESA_CONSUMER_KEY') || process.env.MPESA_CONSUMER_KEY || '';
    this.consumerSecret = config.get('MPESA_CONSUMER_SECRET') || process.env.MPESA_CONSUMER_SECRET || '';
    this.shortcode = config.get('MPESA_SHORTCODE') || process.env.MPESA_SHORTCODE || '174379';
    this.passkey = config.get('MPESA_PASSKEY') || process.env.MPESA_PASSKEY || '';
    this.callbackUrl = config.get('MPESA_CALLBACK_URL') || process.env.MPESA_CALLBACK_URL || '';

    this.logger.log(`M-Pesa initialized - Shortcode: ${this.shortcode}, Key: ${this.consumerKey?.slice(0,8)}...`);
  }

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const { data } = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    );
    return data.access_token;
  }

  private getPassword(): { password: string; timestamp: string } {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
    return { password, timestamp };
  }

  async stkPush(phone: string, amount: number, saleId: string, accountRef: string) {
    try {
      this.logger.log(`STK Push - Phone: ${phone}, Amount: ${amount}, Ref: ${accountRef}`);
      this.logger.log(`Using shortcode: ${this.shortcode}, Key: ${this.consumerKey?.slice(0,8)}...`);

      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.getPassword();

      const formattedPhone = phone.startsWith('0')
        ? `254${phone.slice(1)}`
        : phone.startsWith('+') ? phone.slice(1) : phone;

      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(amount),
        PartyA: formattedPhone,
        PartyB: this.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: `${this.callbackUrl}/api/v1/mpesa/callback`,
        AccountReference: accountRef,
        TransactionDesc: `PharmaPos ${accountRef}`,
      };

      this.logger.log(`Callback URL: ${payload.CallBackURL}`);

      const { data } = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      this.logger.log(`STK Push sent: ${data.CheckoutRequestID}`);

      const tx = await this.prisma.mpesaTransaction.create({
        data: {
          merchantRequestId: data.MerchantRequestID,
          checkoutRequestId: data.CheckoutRequestID,
          phoneNumber: formattedPhone,
          amount,
          status: 'PENDING',
        },
      });

      return {
        success: true,
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
        transactionId: tx.id,
        message: 'STK Push sent. Enter PIN on your phone.',
      };
    } catch (error: any) {
      this.logger.error('STK Push failed:', JSON.stringify(error.response?.data || error.message));
      throw new BadRequestException(
        error.response?.data?.errorMessage || error.response?.data?.fault?.faultstring || 'M-Pesa request failed'
      );
    }
  }

  async handleCallback(body: any) {
    this.logger.log('Callback received:', JSON.stringify(body));
    try {
      const { stkCallback } = body.Body;
      const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

      const tx = await this.prisma.mpesaTransaction.findUnique({
        where: { checkoutRequestId: CheckoutRequestID },
      });
      if (!tx) return { ResultCode: 0, ResultDesc: 'Accepted' };

      if (ResultCode === 0) {
        const items = CallbackMetadata?.Item || [];
        const receiptNo = items.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
        await this.prisma.mpesaTransaction.update({
          where: { checkoutRequestId: CheckoutRequestID },
          data: { status: 'SUCCESS', mpesaReceiptNo: receiptNo, resultCode: ResultCode, resultDesc: ResultDesc, confirmedAt: new Date() },
        });
        this.logger.log(`Payment confirmed: ${receiptNo}`);
      } else {
        await this.prisma.mpesaTransaction.update({
          where: { checkoutRequestId: CheckoutRequestID },
          data: { status: 'FAILED', resultCode: ResultCode, resultDesc: ResultDesc },
        });
      }
    } catch (e) {
      this.logger.error('Callback processing error:', e);
    }
    return { ResultCode: 0, ResultDesc: 'Accepted' };
  }

  async queryStatus(checkoutRequestId: string) {
    try {
      const accessToken = await this.getAccessToken();
      const { password, timestamp } = this.getPassword();

      await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
        {
          BusinessShortCode: this.shortcode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch (e) {
      this.logger.warn('Query API error - checking DB');
    }

    const tx = await this.prisma.mpesaTransaction.findUnique({
      where: { checkoutRequestId },
    });
    return { status: tx?.status || 'UNKNOWN', mpesaReceiptNo: tx?.mpesaReceiptNo };
  }
}
