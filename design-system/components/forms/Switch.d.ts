import React from 'react';
export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  description?: string;
  disabled?: boolean;
  /** In-flight state while the change is persisting. */
  loading?: boolean;
  onChange?: (checked: boolean, e: React.ChangeEvent) => void;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
}
/** Immediate-effect binary toggle (settings, notifications). Use Checkbox for submit-time changes. */
export function Switch(props: SwitchProps): JSX.Element;
