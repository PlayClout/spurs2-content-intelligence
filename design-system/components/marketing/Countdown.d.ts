import React from 'react';
export interface CountdownProps {
  days?: number;
  hours?: number;
  minutes?: number;
  style?: React.CSSProperties;
}
/** Urgency countdown — three Carbon blocks (days / hrs / min) with italic numerals. */
export function Countdown(props: CountdownProps): JSX.Element;
