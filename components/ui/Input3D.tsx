'use client';

import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface Input3DProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

interface Select3DProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  options: { value: string; label: string }[];
}

export const Input3D = forwardRef<HTMLInputElement, Input3DProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-600 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3.5
              ${icon ? 'pl-12' : ''}
              bg-gradient-to-br from-gray-50 to-white
              rounded-2xl
              shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]
              border border-gray-100
              text-gray-800 placeholder:text-gray-400
              transition-all duration-200
              focus:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.9),0_0_0_3px_rgba(140,158,255,0.3)]
              focus:border-vista-blue/30
              focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-300 focus:border-red-300 focus:ring-red-200' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input3D.displayName = 'Input3D';

export const Select3D = forwardRef<HTMLSelectElement, Select3DProps>(
  ({ label, error, icon, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-600 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={`
              w-full px-4 py-3.5 pr-10
              ${icon ? 'pl-12' : ''}
              bg-gradient-to-br from-gray-50 to-white
              rounded-2xl
              shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]
              border border-gray-100
              text-gray-800
              transition-all duration-200
              focus:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.9),0_0_0_3px_rgba(140,158,255,0.3)]
              focus:border-vista-blue/30
              focus:outline-none
              appearance-none cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-300 focus:border-red-300 focus:ring-red-200' : ''}
              ${className}
            `}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Select3D.displayName = 'Select3D';

export default Input3D;
