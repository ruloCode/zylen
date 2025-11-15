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
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step);
          const isCurrent = step === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step}>
              {/* Step Circle */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'border-2 transition-all duration-300',
                    isCompleted
                      ? 'bg-teal-500 border-teal-500 text-white'
                      : isCurrent
                      ? 'bg-gold-500 border-gold-500 text-white scale-110'
                      : 'bg-charcoal-700 border-charcoal-600 text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check size={20} className="animate-in fade-in zoom-in duration-300" />
                  ) : (
                    <span className="text-sm font-bold">{step + 1}</span>
                  )}
                </div>

                {/* Step Label (mobile-hidden) */}
                <span
                  className={cn(
                    'hidden sm:block text-xs font-medium transition-colors duration-300',
                    isCurrent ? 'text-gold-400' : 'text-gray-500'
                  )}
                >
                  Paso {step + 1}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-colors duration-300',
                    isCompleted ? 'bg-teal-500' : 'bg-charcoal-600'
                  )}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Text */}
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-400">
          Paso {currentStep + 1} de {TOTAL_ONBOARDING_STEPS}
        </p>
      </div>
    </div>
  );
}

export default OnboardingProgress;
