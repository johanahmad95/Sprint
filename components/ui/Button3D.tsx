'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';

interface Button3DProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button3D = forwardRef<HTMLButtonElement, Button3DProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      relative inline-flex items-center justify-center font-semibold
      transition-all duration-200 ease-out
      disabled:opacity-50 disabled:cursor-not-allowed
      focus:outline-none focus:ring-2 focus:ring-offset-2
    `;

    const variants = {
      primary: `
        bg-gradient-to-b from-tomato-light to-tomato
        text-white rounded-full
        shadow-[6px_6px_12px_rgba(0,0,0,0.15),-3px_-3px_8px_rgba(255,255,255,0.3),inset_1px_1px_2px_rgba(255,255,255,0.4)]
        hover:shadow-[8px_8px_16px_rgba(0,0,0,0.18),-4px_-4px_10px_rgba(255,255,255,0.35),inset_1px_1px_2px_rgba(255,255,255,0.5),0_0_30px_rgba(240,96,56,0.4)]
        hover:-translate-y-0.5
        active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.15),inset_-2px_-2px_6px_rgba(255,255,255,0.2)]
        active:translate-y-0
        focus:ring-tomato/50
      `,
      secondary: `
        bg-gradient-to-b from-vista-blue-light to-vista-blue
        text-white rounded-full
        shadow-[6px_6px_12px_rgba(0,0,0,0.12),-3px_-3px_8px_rgba(255,255,255,0.3),inset_1px_1px_2px_rgba(255,255,255,0.4)]
        hover:shadow-[8px_8px_16px_rgba(0,0,0,0.15),-4px_-4px_10px_rgba(255,255,255,0.35),0_0_25px_rgba(140,158,255,0.4)]
        hover:-translate-y-0.5
        active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.12)]
        active:translate-y-0
        focus:ring-vista-blue/50
      `,
      outline: `
        bg-white/80 border-2 border-gray-200
        text-gray-700 rounded-full
        shadow-[4px_4px_10px_rgba(0,0,0,0.08),-2px_-2px_6px_rgba(255,255,255,0.8)]
        hover:border-vista-blue hover:text-vista-blue
        hover:shadow-[6px_6px_14px_rgba(0,0,0,0.1),-3px_-3px_8px_rgba(255,255,255,0.9)]
        hover:-translate-y-0.5
        active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.06)]
        active:translate-y-0
        focus:ring-vista-blue/30
      `,
      ghost: `
        bg-transparent
        text-gray-600 rounded-full
        hover:bg-gray-100/80 hover:text-gray-800
        active:bg-gray-200/60
        focus:ring-gray-300
      `,
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm gap-1.5',
      md: 'px-6 py-3 text-base gap-2',
      lg: 'px-8 py-4 text-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button3D.displayName = 'Button3D';

export default Button3D;
