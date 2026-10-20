import React from 'react';
export interface InputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'search' | 'url';
  /** sm 40 · md 48 (default, clears Android 48dp) · lg 56 */
  size?: 'sm' | 'md' | 'lg';
  /** Validation state. Always pair with a FormField message — never color alone. */
  status?: 'success' | 'warning' | 'error' | 'info';
  disabled?: boolean;
  readOnly?: boolean;
  /** Shows a trailing spinner (async validation, lookup). */
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}
/** Text input with the full Clout state set (default/hover/focus/disabled/loading/success/warning/error). */
export function Input(props: InputProps): JSX.Element;
export const STATUS_COLOR: Record<string, { border: string; fg: string; ring: string }>;
