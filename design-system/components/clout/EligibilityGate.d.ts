import React from 'react';
export interface EligibilityStep {
  id?: string;
  /** e.g. "Confirm you're 18+", "Verify your location", "Verify identity". */
  label: string;
  /** Secondary line, e.g. "Required in your region". */
  detail?: string;
  state: 'pending' | 'active' | 'complete' | 'blocked';
}
export interface EligibilityGateProps {
  /** Prize being redeemed — named in the explanation copy. */
  prizeName?: string;
  /** Ordered verification steps (age → geo → identity). */
  steps?: EligibilityStep[];
  /** Override the default legal footnote. */
  note?: string;
  /** Shown as a blocking alert when the fan is ineligible (e.g. restricted jurisdiction). */
  blockedReason?: string;
  /** Form controls for the active step. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
/**
 * Age / geo / KYC verification for the REDEMPTION flow.
 *
 * Placement rule: this gate appears when a fan redeems a real-world prize — never at signup
 * and never before play. Clout is free to play and open to all; eligibility is a prize
 * fulfilment requirement (sweepstakes compliance), not a condition of participation.
 *
 * Render inside `<Modal presentation="sheet" dismissible={false}>`.
 */
export function EligibilityGate(props: EligibilityGateProps): JSX.Element;
