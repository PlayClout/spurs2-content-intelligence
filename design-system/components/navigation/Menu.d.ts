import React from 'react';
export interface MenuItemDef {
  id?: string;
  label?: string;
  /** Icon name from the Clout set. */
  icon?: string;
  /** Trailing meta text (shortcut, value). */
  meta?: string;
  /** Shows a trailing check (single-select menus). */
  checked?: boolean;
  /** `danger` for destructive actions (leave contest, delete account). */
  tone?: 'default' | 'danger';
  disabled?: boolean;
  /** Renders a separator instead of an item. */
  divider?: boolean;
}
export interface MenuProps {
  items: MenuItemDef[];
  onSelect?: (id: string) => void;
  style?: React.CSSProperties;
}
/** Action list from a trigger. Present as a bottom Sheet on mobile, anchored popover on web. */
export function Menu(props: MenuProps): JSX.Element;
