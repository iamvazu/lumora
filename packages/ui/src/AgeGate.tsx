import * as React from 'react';
import { Button } from './Button';
import { Card } from './Card';

export interface AgeGateProps {
  onConfirm: () => void;
  onReject?: () => void;
}

export const AgeGate: React.FC<AgeGateProps> = ({ onConfirm, onReject }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <Card glow className="max-w-md w-full text-center space-y-6 p-8 border-purple-500/20">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
          <span className="text-2xl font-black">18+</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Age Verification Required</h2>
          <p className="text-sm text-zinc-400">
            Lumora contains adult content intended solely for verified adults aged 18 and older (or the age of majority in your jurisdiction).
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Button variant="gradient" size="lg" className="w-full" onClick={onConfirm}>
            I am 18 or older — Enter Lumora
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="w-full text-zinc-400 hover:text-zinc-200"
            onClick={onReject || (() => (window.location.href = 'https://google.com'))}
          >
            I am under 18 — Exit
          </Button>
        </div>

        <p className="text-[11px] text-zinc-600 leading-relaxed">
          By clicking enter, you confirm that you are at least 18 years old and consent to viewing sexually explicit material.
        </p>
      </Card>
    </div>
  );
};

export interface StepperProps {
  steps: { id: string; label: string }[];
  currentStepIndex: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStepIndex }) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-800 w-full -z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-purple-600 transition-all duration-300 -z-0"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-purple-600 text-white'
                    : isCurrent
                      ? 'bg-zinc-950 border-2 border-purple-500 text-purple-400 shadow-lg shadow-purple-500/20'
                      : 'bg-zinc-900 border border-zinc-700 text-zinc-500'
                }`}
              >
                {isCompleted ? '✓' : idx + 1}
              </div>
              <span
                className={`text-[11px] font-medium mt-2 transition-colors ${
                  isCurrent ? 'text-purple-300 font-semibold' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
