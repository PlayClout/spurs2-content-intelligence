import React from 'react';
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
export interface SelectProps {
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'success' | 'error';
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
}
/** Native select styled to match Input — correct choice on iOS/Android for simple option sets. */
export function Select(props: SelectProps): JSX.Element;
