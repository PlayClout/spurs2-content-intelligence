import React from 'react';
export interface TabItem {
  id: string;
  label: string;
  /** Optional count pill (e.g. open contests). */
  count?: number;
}
export interface TabsProps {
  items: TabItem[];
  active?: string;
  onChange?: (id: string) => void;
  /** Horizontal scroll when the set overflows (default true). */
  scrollable?: boolean;
  style?: React.CSSProperties;
}
/** In-page section switcher with an Action-gradient underline indicator. */
export function Tabs(props: TabsProps): JSX.Element;
