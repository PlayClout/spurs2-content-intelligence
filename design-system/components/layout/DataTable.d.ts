import React from 'react';
export interface DataColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  /** Render in the athletic italic display face (scores, prize values). */
  emphasis?: boolean;
  /** Tabular figures for aligned numerals. */
  numeric?: boolean;
}
export interface DataTableProps {
  columns: DataColumn[];
  rows: Array<Record<string, React.ReactNode> & { id?: string | number }>;
  /** Row id to highlight — use for "you" in a leaderboard. */
  highlightRow?: string | number;
  dense?: boolean;
  style?: React.CSSProperties;
}
/** Tabular data for tablet/desktop. Below --bp-md render a ListRow stack instead — never side-scroll. */
export function DataTable(props: DataTableProps): JSX.Element;
