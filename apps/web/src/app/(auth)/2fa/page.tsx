'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card, Badge } from '@lumora/ui';
import { ShieldCheck, Copy, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react';
import { apiRequest } from '../../../lib/api-client';

function TwoFactorSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMandatory = searchParams.get('mandate') === '1';

  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeDataUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [code, setCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSetup() {
      try {
        const data = await apiRequest('/auth/2fa/setup', { method: 'POST' });
        setSetupData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to initiate 2FA setup. Please log in first.');
      } finally {
        setLoading(false);
      }
    }
    loadSetup();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerifyLoading(true);

    try {
      await apiRequest('/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      router.push('/settings/security');
    } catch (err: any) {
      setError(err.message || 'Invalid authentication code.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-zinc-950 to-zinc-950">
      <Card glow className="max-w-lg w-full p-8 space-y-6 border-zinc-800">
        <div className="text-center space-y-2">
          <Badge variant="purple" className="px-3 py-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Two-Factor Authentication
          </Badge>
          <h1 className="text-2xl font-bold text-white tracking-tight">Protect Your Account</h1>
          <p className="text-xs text-zinc-400">
            {isMandatory
              ? '2FA is mandatory for creator accounts before posting or receiving payouts.'
              : 'Scan the QR code with Google Authenticator, 1Password, or Authy.'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {setupData && (
          <div className="space-y-6">
            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl w-56 h-56 mx-auto shadow-xl">
              <img
                src={setupData.qrCodeDataUrl}
                alt="2FA QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Secret key string fallback */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block text-center">
                Or enter secret key manually
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 text-xs font-mono justify-between text-zinc-300">
                <span className="truncate">{setupData.secret}</span>
                <button
                  type="button"
                  onClick={copySecret}
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-sans font-medium"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Backup Codes */}
            <div className="p-3.5 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> Save Your Backup Codes
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-zinc-300">
                {setupData.backupCodes.map((c, i) => (
                  <span key={i} className="p-1 bg-zinc-950 rounded text-center border border-zinc-800/60">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerify} className="space-y-4 pt-2">
              <Input
                label="Enter 6-Digit Verification Code"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />

              <Button variant="gradient" size="lg" className="w-full" isLoading={verifyLoading}>
                Enable 2FA & Complete Setup <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function TwoFactorSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
          <div className="animate-spin h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      }
    >
      <TwoFactorSetupContent />
    </Suspense>
  );
}
