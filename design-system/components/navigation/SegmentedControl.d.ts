import React from 'react';
export interface SegmentItem {
  id: string;
  label: string;
  disabled?: boolean;
}
export interface SegmentedControlProps {
  /** 2–4 options. More belongs in Tabs. */
  items: SegmentItem[];
  value?: string;
  onChange?: (id: string) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  style?: React.CSSProperties;
}
/** Mutually exclusive view switch in a single track (Daily / Weekly / Season). */
export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
