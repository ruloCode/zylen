import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils';
import { TOTAL_ONBOARDING_STEPS } from '@/types';

interface OnboardingProgressProps {
  currentStep: number;
  completedSteps: number[];
}

/**
 * OnboardingProgress Component
 *
 * Shows a visual progress indicator for the onboarding flow
 */
export function OnboardingProgress({ currentStep, completedSteps }: OnboardingProgressProps) {
  const steps = Array.from({ length: TOTAL_ONBOARDING_STEPS }, (_, i) => i);

  return (
    <nav aria-label="Onboarding progress" className="w-full max-w-md mx-auto">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step);
          const isCurrent = step === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step}>
              {/* Step Circle */}
              <li className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center',
                    'border-2 transition-all duration-300',
                    isCompleted
                      ? 'bg-[hsl(var(--primary))]/70 border-[hsl(var(--primary))]/70 text-white'
                      : isCurrent
                      ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-white scale-110'
                      : 'bg-white/5 border-white/10 text-gray-400'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check size={20} className="animate-in fade-in zoom-in duration-300" aria-hidden="true" />
                  ) : (
                    <span className="text-sm font-bold">{step + 1}</span>
                  )}
                </div>

                {/* Step Label (mobile-hidden) */}
                <span
                  className={cn(
                    'hidden sm:block text-xs font-medium transition-colors duration-300',
                    isCurrent ? 'text-teal-300' : 'text-gray-500'
                  )}
                >
                  Paso {step + 1}
                </span>
              </li>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-colors duration-300',
                    isCompleted ? 'bg-[hsl(var(--primary))]/70' : 'bg-charcoal-600'
                  )}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>

      {/* Progress Text */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-400" aria-live="polite">
          Paso {currentStep + 1} de {TOTAL_ONBOARDING_STEPS}
        </p>
      </div>
    </nav>
  );
}

export default OnboardingProgress;
