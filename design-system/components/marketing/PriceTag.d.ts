import React from 'react';
export interface PriceTagProps {
  label?: string;
  value?: string;
  style?: React.CSSProperties;
}
/** Prize-value tag — solid Action-gradient with dark text. Not a button, not a pooled stake. */
export function PriceTag(props: PriceTagProps): JSX.Element;
