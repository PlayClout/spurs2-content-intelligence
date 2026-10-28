import React from 'react';
export interface OnboardingStepProps {
  /** 1-based current step. */
  step?: number;
  total?: number;
  eyebrow?: string;
  title: string;
  description?: string;
  /** Cinematic hero slot — product art, badge, or illustration. */
  hero?: React.ReactNode;
  /** Full-width primary CTA. */
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  onSkip?: () => void;
  style?: React.CSSProperties;
}
/** Full-screen first-run step: progress dots → hero → headline → body → actions pinned to base. */
export function OnboardingStep(props: OnboardingStepProps): JSX.Element;
