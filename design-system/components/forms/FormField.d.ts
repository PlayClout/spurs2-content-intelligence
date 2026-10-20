import React from 'react';
export interface FormFieldProps {
  label?: string;
  /** id of the control this label points at — always set it. */
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  /** Persistent hint shown when there is no status message. */
  helper?: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  /** Status message — required whenever `status` is set (never signal with color alone). */
  message?: string;
  disabled?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
/** Labelled wrapper every form control ships inside — owns label, required marker, helper & status message. */
export function FormField(props: FormFieldProps): JSX.Element;
