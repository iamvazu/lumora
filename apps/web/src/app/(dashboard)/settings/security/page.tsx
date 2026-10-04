'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Badge } from '@lumora/ui';
import { Laptop, Smartphone, Trash2, LogOut, Sparkles, KeyRound } from 'lucide-react';
import { apiRequest, setAccessToken } from '../../../../lib/api-client';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [profData, sessData] = await Promise.all([
          apiRequest('/me'),
          apiRequest('/me/sessions'),
        ]);
        setProfile(profData);
        setSessions(sessData);
      } catch (err: any) {
        // If not logged in, redirect to signin
        router.push('/signin');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await apiRequest(`/me/sessions/${sessionId}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setMessage('Session successfully revoked.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to revoke session');
    }
  };

  const handleLogout = async () => {
    setActionLoading(true);
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      setAccessToken(null);
      router.push('/signin');
    } catch {
      router.push('/signin');
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
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-white">Lumora</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} isLoading={actionLoading} className="gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10 max-w-4xl flex-1 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Security & Active Sessions</h1>
            <p className="text-sm text-zinc-400">Manage two-factor authentication and device sessions</p>
          </div>
          {profile && (
            <Badge variant="purple" className="self-start sm:self-auto capitalize px-3 py-1 text-sm">
              Role: {profile.role}
            </Badge>
          )}
        </div>

        {message && (
          <div className="p-3.5 bg-emerald-950/50 border border-emerald-800/50 rounded-xl text-xs text-emerald-300">
            {message}
          </div>
        )}

        {/* 2FA Card */}
        <Card glow className="p-6 space-y-4 border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Two-Factor Authentication (TOTP)</h3>
                <p className="text-xs text-zinc-400">Add an extra layer of security using an authenticator app</p>
              </div>
            </div>

            {profile?.is2FAEnabled ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="warning">Not Configured</Badge>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            {!profile?.is2FAEnabled ? (
              <Link href="/2fa">
                <Button variant="gradient" size="sm">
                  Enable 2FA
                </Button>
              </Link>
            ) : (
              <span className="text-xs text-zinc-500">2FA is actively protecting your account</span>
            )}
          </div>
        </Card>

        {/* Active Sessions Card */}
        <Card className="p-6 space-y-6 border-zinc-800">
          <div>
            <h3 className="text-base font-semibold text-white">Active Device Sessions</h3>
            <p className="text-xs text-zinc-400">These devices are currently authenticated to your Lumora account</p>
          </div>

          <div className="divide-y divide-zinc-800/60">
            {sessions.map((sess) => (
              <div key={sess.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                    {sess.userAgent?.includes('Mobile') ? (
                      <Smartphone className="w-5 h-5" />
                    ) : (
                      <Laptop className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {sess.userAgent ? sess.userAgent.split(' ')[0] : 'Web Browser'}
                      </span>
                      {sess.isCurrent && <Badge variant="purple">Current Session</Badge>}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      IP: {sess.ip || 'Localhost'} · Created {new Date(sess.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-400 border-rose-900/40 hover:bg-rose-950/40"
                    onClick={() => handleRevokeSession(sess.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
