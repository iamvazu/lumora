'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@lumora/ui';
import { Sparkles, KeyRound, ArrowRight } from 'lucide-react';
import { apiRequest, setAccessToken } from '../../../lib/api-client';

export default function SignInPage() {
  const router = useRouter();
  const [emailOrHandle, setEmailOrHandle] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          emailOrHandle,
          password,
          totpCode: requires2FA ? totpCode : undefined,
        }),
      });

      if (data.requires2FA) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      setAccessToken(data.accessToken);
      router.push('/settings/security');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-zinc-950 to-zinc-950">
      <Card glow className="max-w-md w-full p-8 space-y-6 border-zinc-800">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-xs text-zinc-400">Sign in to your Lumora account</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!requires2FA ? (
            <>
              <Input
                label="Email or Handle"
                placeholder="you@domain.com or @handle"
                value={emailOrHandle}
                onChange={(e) => setEmailOrHandle(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl flex items-center gap-3 text-xs text-purple-200">
                <KeyRound className="w-5 h-5 text-purple-400 shrink-0" />
                <span>Two-factor authentication is active on your account. Enter the 6-digit code from your authenticator app.</span>
              </div>

              <Input
                label="6-Digit Authentication Code"
                placeholder="123456"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
                autoFocus
              />
            </div>
          )}

          <Button variant="gradient" size="lg" className="w-full mt-2" isLoading={loading}>
            {requires2FA ? 'Verify 2FA & Log In' : 'Sign In'} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="text-center text-xs text-zinc-500">
          Don't have an account?{' '}
          <Link href="/signup" className="text-purple-400 hover:underline font-medium">
            Create an Account
          </Link>
        </div>
      </Card>
    </div>
  );
}
