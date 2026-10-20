import React from 'react';
export interface TabBarItem {
  id: string;
  label: string;
  /** Icon name from the Clout icon set. */
  icon: string;
  /** Notification count / dot content. */
  badge?: string | number;
}
export interface TabBarProps {
  /** 3–5 destinations. More than 5 belongs in a "More" screen. */
  items: TabBarItem[];
  active?: string;
  onChange?: (id: string) => void;
  style?: React.CSSProperties;
}
/** Primary mobile navigation (iOS tab bar / Android bottom nav). Labelled, safe-area aware. */
export function TabBar(props: TabBarProps): JSX.Element;
