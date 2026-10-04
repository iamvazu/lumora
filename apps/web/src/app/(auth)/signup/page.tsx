'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@lumora/ui';
import { Sparkles, User, Flame, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiRequest, setAccessToken } from '../../../lib/api-client';

export default function SignUpPage() {
  const router = useRouter();
  const [role, setRole] = useState<'fan' | 'creator'>('fan');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          handle,
          displayName: displayName || handle,
          role,
          country: 'US',
        }),
      });

      setAccessToken(data.accessToken);

      if (role === 'creator') {
        // Mandatory 2FA for creators
        router.push('/2fa?mandate=1');
      } else {
        router.push('/settings/security');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your Lumora Account</h1>
          <p className="text-xs text-zinc-400">Join verified fans and independent creators</p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setRole('fan')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              role === 'fan'
                ? 'bg-zinc-800 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Fan Account
          </button>
          <button
            type="button"
            onClick={() => setRole('creator')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              role === 'creator'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Creator Account
          </button>
        </div>

        {role === 'creator' && (
          <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl flex items-start gap-2 text-xs text-purple-300">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
            <span>Creators receive 80% earnings and must complete identity verification (18+) + 2FA setup.</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Unique Handle"
            placeholder="yourhandle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            required
            helperText="lumora.app/@yourhandle"
          />

          <Input
            label="Display Name"
            placeholder="Your Name or Alias"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helperText="At least 8 characters with upper, lower, & number"
          />

          <Button variant="gradient" size="lg" className="w-full mt-2" isLoading={loading}>
            Create Account <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="text-center text-xs text-zinc-500">
          Already have an account?{' '}
          <Link href="/signin" className="text-purple-400 hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
