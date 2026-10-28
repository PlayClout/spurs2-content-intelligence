import React from 'react';
export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  /** Mixed state for "select all" parents. */
  indeterminate?: boolean;
  label?: string;
  /** Secondary line under the label. */
  description?: string;
  disabled?: boolean;
  status?: 'error';
  onChange?: (checked: boolean, e: React.ChangeEvent) => void;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
}
/** 24px checkbox with accent fill, indeterminate support and a 48px touch row. */
export function Checkbox(props: CheckboxProps): JSX.Element;
