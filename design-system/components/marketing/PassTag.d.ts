import React from 'react';
export interface PassTagProps {
  /** Pass name, pattern "[Event/Partner] Pass", e.g. "OPEN PASS". */
  name?: string;
  style?: React.CSSProperties;
}
/** Campaign / pass label as a gradient-outline pill (won't compete with the primary CTA). */
export function PassTag(props: PassTagProps): JSX.Element;
