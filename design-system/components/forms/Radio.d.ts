import React from 'react';
export interface RadioProps {
  checked?: boolean;
  label?: string;
  description?: string;
  disabled?: boolean;
  value: string;
  name: string;
  onChange?: (value: string, e: React.ChangeEvent) => void;
  id?: string;
  style?: React.CSSProperties;
}
export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}
export interface RadioGroupProps {
  name: string;
  value?: string;
  options: RadioOption[];
  onChange?: (value: string, e: React.ChangeEvent) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}
/** Single radio control. Prefer RadioGroup, which owns selection for the set. */
export function Radio(props: RadioProps): JSX.Element;
/** Radio set with `role="radiogroup"` — pass options and a controlled value. */
export function RadioGroup(props: RadioGroupProps): JSX.Element;
