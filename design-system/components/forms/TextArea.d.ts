import React from 'react';
export interface TextAreaProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  /** Show the character counter (requires maxLength). Turns amber past 90%. */
  showCount?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
}
/** Multi-line text input with the Clout state model and optional character counter. */
export function TextArea(props: TextAreaProps): JSX.Element;
