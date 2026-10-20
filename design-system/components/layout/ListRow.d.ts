import React from 'react';
export interface ListRowProps {
  /** Leading slot — Avatar, Icon, rank number. */
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Trailing emphasis value (score, amount, XP). */
  value?: React.ReactNode;
  valueTone?: 'default' | 'muted' | 'value' | 'success' | 'danger';
  /** Custom trailing slot (Switch, Chip). */
  trailing?: React.ReactNode;
  chevron?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  divider?: boolean;
  style?: React.CSSProperties;
}
/** Workhorse list row for settings, leaderboards, transactions. 48px min height. */
export function ListRow(props: ListRowProps): JSX.Element;
