'use client';

import React, { useState } from 'react';
import { Card, Button } from '@lumora/ui';
import {
  Lock,
  Heart,
  CreditCard,
  Wallet as WalletIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ShieldCheck,
  Tag,
} from 'lucide-react';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'ppv' | 'tip' | 'subscription';
  title: string;
  creatorName: string;
  creatorHandle: string;
  creatorId: string;
  resourceId?: string;
  priceCents?: number;
  walletBalanceCents?: number;
  onSuccess?: (result: any) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  creatorName,
  creatorHandle,
  creatorId,
  resourceId,
  priceCents = 1000,
  walletBalanceCents = 2500,
  onSuccess,
}) => {
  const [paymentSource, setPaymentSource] = useState<'wallet' | 'card'>('wallet');
  const [tipAmountCents, setTipAmountCents] = useState<number>(priceCents || 1000);
  const [tipMessage, setTipMessage] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ discountPct: number; code: string } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentPrice = type === 'tip' ? tipAmountCents : priceCents;
  const discountAmount = promoApplied
    ? Math.round((currentPrice * promoApplied.discountPct) / 100)
    : 0;
  const finalPriceCents = Math.max(0, currentPrice - discountAmount);
  const hasSufficientWallet = walletBalanceCents >= finalPriceCents;

  const handleApplyPromo = () => {
    setPromoError('');
    if (!promoCode.trim()) return;

    // Simulate promo code validation
    if (promoCode.trim().toUpperCase() === 'WELCOME50' || promoCode.trim().toUpperCase() === 'VIP20') {
      const discount = promoCode.trim().toUpperCase() === 'WELCOME50' ? 50 : 20;
      setPromoApplied({ code: promoCode.trim().toUpperCase(), discountPct: discount });
    } else {
      setPromoError('Invalid or expired discount code.');
    }
  };

  const handleExecutePayment = async () => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      // Simulate API call to /v1/purchases or /v1/subscriptions
      await new Promise((resolve) => setTimeout(resolve, 600));

      setIsCompleted(true);
      if (onSuccess) {
        onSuccess({
          type,
          creatorId,
          resourceId,
          amountCents: finalPriceCents,
          paymentSource,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment execution failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const tipPresets = [500, 1000, 2000, 5000, 10000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md">
        <Card className="p-6 bg-zinc-950 border border-zinc-800/80 shadow-2xl rounded-2xl overflow-hidden relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {isCompleted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white">Payment Confirmed!</h3>
              <p className="text-sm text-zinc-400">
                {type === 'ppv' && 'Content unlocked and added to your feed.'}
                {type === 'tip' && `Your tip was sent to @${creatorHandle} with your note.`}
                {type === 'subscription' && `You are now subscribed to @${creatorHandle}!`}
              </p>
              <div className="pt-4">
                <Button variant="primary" className="w-full" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg">
                  {type === 'ppv' && <Lock className="w-6 h-6" />}
                  {type === 'tip' && <Heart className="w-6 h-6" />}
                  {type === 'subscription' && <Sparkles className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{title}</h3>
                  <p className="text-xs text-zinc-400">
                    Supporting <span className="text-zinc-200 font-medium">{creatorName}</span> (@{creatorHandle})
                  </p>
                </div>
              </div>

              {/* Tipping presets */}
              {type === 'tip' && (
                <div className="space-y-3">
                  <label className="text-xs font-medium text-zinc-400">Select Tip Amount</label>
                  <div className="grid grid-cols-5 gap-2">
                    {tipPresets.map((cents) => (
                      <button
                        key={cents}
                        type="button"
                        onClick={() => setTipAmountCents(cents)}
                        className={`py-2 text-xs font-semibold rounded-xl border transition ${
                          tipAmountCents === cents
                            ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        ${(cents / 100).toFixed(0)}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-medium text-zinc-400">Message (Optional)</label>
                    <textarea
                      rows={2}
                      value={tipMessage}
                      onChange={(e) => setTipMessage(e.target.value)}
                      placeholder="Leave an encouraging note..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Promo Code Input for Subscriptions */}
              {type === 'subscription' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Discount code (e.g. WELCOME50)"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 uppercase"
                      />
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleApplyPromo}>
                      Apply
                    </Button>
                  </div>
                  {promoApplied && (
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Code {promoApplied.code} applied ({promoApplied.discountPct}% off)
                    </p>
                  )}
                  {promoError && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {promoError}
                    </p>
                  )}
                </div>
              )}

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400">Payment Source</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentSource('wallet')}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentSource === 'wallet'
                        ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <WalletIcon className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-semibold text-white">Fan Wallet</span>
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      Balance: ${(walletBalanceCents / 100).toFixed(2)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentSource('card')}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentSource === 'card'
                        ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-pink-400" />
                      <span className="text-xs font-semibold text-white">Direct Card</span>
                    </div>
                    <span className="text-[11px] text-zinc-400">CCBill / Segpay</span>
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-3.5 bg-zinc-900/60 rounded-xl border border-zinc-800/60 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span>${(currentPrice / 100).toFixed(2)}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({promoApplied.discountPct}%)</span>
                    <span>-${(discountAmount / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold pt-1.5 border-t border-zinc-800 text-sm">
                  <span>Total Due</span>
                  <span className="text-purple-400">${(finalPriceCents / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Wallet Insufficient Warning */}
              {paymentSource === 'wallet' && !hasSufficientWallet && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center gap-2 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Insufficient balance. Switch to Direct Card or top up your wallet.
                  </span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                  {errorMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
                  disabled={isProcessing || (paymentSource === 'wallet' && !hasSufficientWallet)}
                  onClick={handleExecutePayment}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isProcessing
                    ? 'Processing Double-Entry...'
                    : `Pay $${(finalPriceCents / 100).toFixed(2)}`}
                </Button>

                <p className="text-[10px] text-center text-zinc-500 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-zinc-400" /> Secure 256-bit encrypted checkout · Non-refundable digital transaction
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
