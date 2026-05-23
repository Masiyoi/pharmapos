'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { Smartphone, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Props {
  amount: number;
  saleId: string;
  receiptNo: string;
  onSuccess: (mpesaCode: string) => void;
  onCancel: () => void;
}

export default function MpesaModal({ amount, saleId, receiptNo, onSuccess, onCancel }: Props) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'input' | 'waiting' | 'success' | 'failed'>('input');
  const [checkoutRequestId, setCheckoutRequestId] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [error, setError] = useState('');
  const [pollCount, setPollCount] = useState(0);

  // Poll for payment status every 3 seconds
  useEffect(() => {
    if (step !== 'waiting' || !checkoutRequestId) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/mpesa/status/${checkoutRequestId}`);
        setPollCount(c => c + 1);

        if (data.status === 'SUCCESS') {
          setMpesaCode(data.mpesaReceiptNo || 'CONFIRMED');
          setStep('success');
          clearInterval(interval);
          setTimeout(() => onSuccess(data.mpesaReceiptNo), 1500);
        } else if (data.status === 'FAILED') {
          setStep('failed');
          setError('Payment cancelled or failed. Please try again.');
          clearInterval(interval);
        } else if (pollCount >= 20) {
          // Timeout after 60 seconds
          setStep('failed');
          setError('Payment timed out. Please check your phone and try again.');
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, checkoutRequestId, pollCount]);

  const sendStkPush = async () => {
    if (!phone || phone.length < 10) return setError('Enter a valid phone number');
    setError('');

    try {
      const { data } = await api.post('/mpesa/stk-push', {
        phone,
        amount,
        saleId,
        receiptNo,
      });
      setCheckoutRequestId(data.checkoutRequestId);
      setStep('waiting');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send STK Push');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">

        {/* Input step */}
        {step === 'input' && (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Smartphone size={28} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">M-Pesa Payment</h2>
              <p className="text-gray-500 text-sm">Amount: <span className="font-bold text-gray-900">{formatKES(amount)}</span></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Customer Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
                  maxLength={13}
                />
                <p className="text-xs text-gray-400 mt-1">Safaricom number registered with M-Pesa</p>
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

              <button
                onClick={sendStkPush}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                Send Payment Request
              </button>
              <button
                onClick={onCancel}
                className="w-full text-gray-500 hover:text-gray-700 text-sm py-2"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Waiting step */}
        {step === 'waiting' && (
          <div className="text-center py-4">
            <Loader2 size={48} className="text-green-500 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Waiting for Payment</h2>
            <p className="text-gray-500 text-sm mb-1">Check <span className="font-semibold">{phone}</span> for M-Pesa prompt</p>
            <p className="text-gray-400 text-xs">Enter your M-Pesa PIN to complete payment</p>
            <div className="mt-4 bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Amount: <span className="font-semibold text-gray-700">{formatKES(amount)}</span></p>
              <p className="text-xs text-gray-400 mt-1">Ref: <span className="font-mono">{receiptNo}</span></p>
            </div>
            <button onClick={onCancel} className="mt-4 text-gray-400 hover:text-gray-600 text-xs">
              Cancel
            </button>
          </div>
        )}

        {/* Success step */}
        {step === 'success' && (
          <div className="text-center py-4">
            <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Payment Received!</h2>
            <p className="text-gray-500 text-sm">M-Pesa Code:</p>
            <p className="text-2xl font-bold text-green-600 font-mono mt-1">{mpesaCode}</p>
          </div>
        )}

        {/* Failed step */}
        {step === 'failed' && (
          <div className="text-center py-4">
            <XCircle size={56} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => { setStep('input'); setError(''); setPollCount(0); }}
              className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl"
            >
              Try Again
            </button>
            <button onClick={onCancel} className="mt-2 w-full text-gray-400 text-sm py-2">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
