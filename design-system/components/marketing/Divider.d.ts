import React from 'react';
export interface DividerProps {
  /** Show the centered diamond node. */
  node?: boolean;
  style?: React.CSSProperties;
}
/** Action-gradient section divider with optional diamond node. */
export function Divider(props: DividerProps): JSX.Element;
