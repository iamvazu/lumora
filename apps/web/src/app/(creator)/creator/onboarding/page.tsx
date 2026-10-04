'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, Badge, PriceInput } from '@lumora/ui';
import { Sparkles, ShieldCheck, CheckCircle2, ArrowRight, FileText, UserCheck } from 'lucide-react';
import { apiRequest } from '../../../../lib/api-client';

const ONBOARDING_STEPS = [
  { id: 'app', label: '1. Details & Price' },
  { id: 'kyc', label: '2. Identity KYC' },
  { id: 'tax', label: '3. Tax Form' },
  { id: 'review', label: '4. Status' },
];

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState<string[]>(['Cosplay', 'Glamour']);
  const [priceCents, setPriceCents] = useState(999); // $9.99
  const [legalName, setLegalName] = useState('');
  const [taxCountry, setTaxCountry] = useState('US');
  const [taxId, setTaxId] = useState('');
  const [formType, setFormType] = useState<'W-9' | 'W-8BEN'>('W-9');
  const [kycSessionUrl, setKycSessionUrl] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<any>(null);

  const categoriesList = ['Cosplay', 'Glamour', 'Fitness', 'Artistic', 'Alternative', 'Gaming', 'ASMR'];

  useEffect(() => {
    async function checkStatus() {
      try {
        const data = await apiRequest('/creator/status');
        setStatusData(data);
        if (data.hasApplied) {
          if (data.steps.readyForReview || data.status === 'pending_review' || data.status === 'approved') {
            setCurrentStep(3);
          } else if (data.steps.kycStatus === 'approved' && !data.steps.taxProfileSubmitted) {
            setCurrentStep(2);
          } else if (data.steps.application && data.steps.kycStatus !== 'approved') {
            setCurrentStep(1);
          }
        }
      } catch {
        router.push('/signin');
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, [router]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitLoading(true);

    try {
      await apiRequest('/creator/apply', {
        method: 'POST',
        body: JSON.stringify({
          bio,
          category,
          isPaid: true,
          subscriptionPriceCents: priceCents,
          currency: 'USD',
        }),
      });

      const kycData = await apiRequest('/creator/kyc/session', { method: 'POST' });
      setKycSessionUrl(kycData.vendorUrl);
      setCurrentStep(1);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSimulateKycSuccess = async () => {
    setSubmitLoading(true);
    try {
      // Mock vendor callback for local testing
      await apiRequest('/webhooks/kyc/mock_veriff', {
        method: 'POST',
        body: JSON.stringify({
          vendorRef: 'mock_veriff_auto',
          status: 'approved',
          score: 0.96,
          age: 23,
          docMatch: true,
          sanctionsHit: false,
        }),
      });
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'KYC callback simulation failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleTaxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitLoading(true);

    try {
      await apiRequest('/creator/tax-profile', {
        method: 'PUT',
        body: JSON.stringify({
          formType,
          country: taxCountry,
          legalName,
          taxId,
        }),
      });
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to submit tax profile.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleCategory = (cat: string) => {
    if (category.includes(cat)) {
      setCategory(category.filter((c) => c !== cat));
    } else {
      setCategory([...category, cat]);
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
            <span className="font-bold text-lg text-white">Lumora Creator Portal</span>
          </Link>
          <Badge variant="purple">18+ Creator Onboarding</Badge>
        </div>
      </header>

      {/* Main Stepper Container */}
      <main className="container mx-auto px-4 py-10 max-w-2xl flex-1 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Creator Verification Stepper</h1>
          <p className="text-sm text-zinc-400">Complete compliance checks to publish and receive payouts</p>
        </div>

        {/* Stepper Indicator */}
        <div className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-xs">
          {ONBOARDING_STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-center gap-1.5 font-medium ${
                idx === currentStep
                  ? 'text-purple-400 font-bold'
                  : idx < currentStep
                    ? 'text-emerald-400'
                    : 'text-zinc-500'
              }`}
            >
              {idx < currentStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
              <span>{step.label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3.5 bg-rose-950/50 border border-rose-800/50 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* STEP 0: Creator Details & Subscription Price */}
        {currentStep === 0 && (
          <Card glow className="p-8 space-y-6 border-zinc-800">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Profile Details & Pricing</h2>
              <p className="text-xs text-zinc-400">Set your bio, content tags, and standard monthly subscription price</p>
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Creator Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your fans what exclusive content you create..."
                  className="w-full bg-zinc-900/90 text-zinc-100 placeholder:text-zinc-500 rounded-xl border border-zinc-800 p-3.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Category Tags</label>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        category.includes(cat)
                          ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/20'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <PriceInput
                label="Monthly Subscription Price"
                cents={priceCents}
                onChangeCents={setPriceCents}
                minCents={499}
                maxCents={4999}
              />

              <Button variant="gradient" size="lg" className="w-full mt-4" isLoading={submitLoading}>
                Continue to Identity Verification <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </Card>
        )}

        {/* STEP 1: Identity & Age Verification (KYC) */}
        {currentStep === 1 && (
          <Card glow className="p-8 space-y-6 border-zinc-800">
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white pt-2">Identity & 18+ Liveness Verification</h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Visa and Mastercard adult acquiring rules require a valid government photo ID and a real-time liveness biometric check.
              </p>
            </div>

            <div className="p-4 bg-zinc-900/90 rounded-2xl border border-zinc-800 space-y-3 text-xs text-zinc-300">
              <div className="flex items-center gap-2 font-semibold text-white">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>KYC Requirements:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-zinc-400">
                <li>Government-issued Passport, Driver's License, or National ID</li>
                <li>Clear facial photo matching document</li>
                <li>Proof that you are at least 18 years of age</li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              {kycSessionUrl && (
                <a href={kycSessionUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="gradient" size="lg" className="w-full">
                    Launch Identity Verification in Browser
                  </Button>
                </a>
              )}

              <Button
                variant="outline"
                size="md"
                className="w-full text-zinc-300"
                onClick={handleSimulateKycSuccess}
                isLoading={submitLoading}
              >
                Simulate Instant Verified Result (Dev/Test)
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 2: Tax Compliance Profile */}
        {currentStep === 2 && (
          <Card glow className="p-8 space-y-6 border-zinc-800">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Tax Profile Information</h2>
              <p className="text-xs text-zinc-400">Required for 1099-K (US) or DAC7 (EU) year-end payout reporting</p>
            </div>

            <form onSubmit={handleTaxSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormType('W-9')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                    formType === 'W-9'
                      ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Form W-9 (US Citizen/Resident)
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('W-8BEN')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                    formType === 'W-8BEN'
                      ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Form W-8BEN (International)
                </button>
              </div>

              <Input
                label="Full Legal Name"
                placeholder="First Middle Last"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Country of Tax Residence"
                  placeholder="US"
                  maxLength={2}
                  value={taxCountry}
                  onChange={(e) => setTaxCountry(e.target.value.toUpperCase())}
                  required
                />
                <Input
                  label="Tax ID (SSN / EIN / TIN)"
                  type="password"
                  placeholder="•••-••-••••"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  required
                  helperText="Stored in encrypted PII database"
                />
              </div>

              <Button variant="gradient" size="lg" className="w-full mt-4" isLoading={submitLoading}>
                Submit Tax Form & Finalize <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </Card>
        )}

        {/* STEP 3: Review & Approval Status */}
        {currentStep === 3 && (
          <Card glow className="p-8 space-y-6 border-zinc-800 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-purple-600 to-emerald-500 flex items-center justify-center text-white shadow-xl shadow-purple-600/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Application Under Review</h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Your identity verification and tax documentation have been securely recorded. 
                Our Trust & Safety team reviews all creator submissions within 24 hours.
              </p>
            </div>

            <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Account Application:</span>
                <Badge variant="success">Submitted</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Government ID & Liveness:</span>
                <Badge variant="success">Verified (18+)</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Tax Compliance Record:</span>
                <Badge variant="success">Recorded</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Review Status:</span>
                <span className="font-semibold text-purple-300 capitalize">{statusData?.status || 'pending_review'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Moderation SLA:</span>
                <span className="font-semibold text-purple-300">&lt; 24 hours</span>
              </div>
            </div>

            <Link href="/settings/security">
              <Button variant="secondary" size="md" className="w-full">
                Go to Account Security & Settings
              </Button>
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}
