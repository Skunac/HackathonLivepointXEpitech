import { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement>;

export function TextField({ className = "", ...props }: TextFieldProps) {
  return (
    <input
      type="text"
      {...props}
      className={`px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
}
