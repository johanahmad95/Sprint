'use client';

import { HTMLAttributes } from 'react';

interface Badge3DProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'glow' | 'sport' | 'status' | 'outline';
  color?: 'chartreuse' | 'tomato' | 'vista' | 'teal' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const Badge3D = ({
  children,
  variant = 'sport',
  color = 'teal',
  size = 'md',
  pulse = false,
  className = '',
  ...props
}: Badge3DProps) => {
  const variants = {
    glow: {
      chartreuse: `
        bg-chartreuse text-gray-800
        shadow-[0_0_20px_rgba(214,247,76,0.6)]
      `,
      tomato: `
        bg-tomato text-white
        shadow-[0_0_20px_rgba(240,96,56,0.5)]
      `,
      vista: `
        bg-vista-blue text-white
        shadow-[0_0_20px_rgba(140,158,255,0.5)]
      `,
      teal: `
        bg-teal-dark text-white
        shadow-[0_0_20px_rgba(13,77,77,0.4)]
      `,
      gray: `
        bg-gray-600 text-white
        shadow-[0_0_15px_rgba(75,85,99,0.3)]
      `,
    },
    sport: {
      chartreuse: `
        bg-gradient-to-r from-chartreuse-dark to-chartreuse
        text-gray-800
      `,
      tomato: `
        bg-gradient-to-r from-tomato-dark to-tomato
        text-white
      `,
      vista: `
        bg-gradient-to-r from-vista-blue-dark to-vista-blue
        text-white
      `,
      teal: `
        bg-gradient-to-r from-teal-dark to-teal-medium
        text-white
      `,
      gray: `
        bg-gradient-to-r from-gray-600 to-gray-500
        text-white
      `,
    },
    status: {
      chartreuse: `
        bg-chartreuse/20 text-chartreuse-dark
        border border-chartreuse/40
      `,
      tomato: `
        bg-tomato/10 text-tomato-dark
        border border-tomato/30
      `,
      vista: `
        bg-vista-blue/10 text-vista-blue-dark
        border border-vista-blue/30
      `,
      teal: `
        bg-teal-dark/10 text-teal-dark
        border border-teal-dark/30
      `,
      gray: `
        bg-gray-100 text-gray-600
        border border-gray-200
      `,
    },
    outline: {
      chartreuse: `
        bg-transparent text-chartreuse-dark
        border-2 border-chartreuse
      `,
      tomato: `
        bg-transparent text-tomato
        border-2 border-tomato
      `,
      vista: `
        bg-transparent text-vista-blue
        border-2 border-vista-blue
      `,
      teal: `
        bg-transparent text-teal-dark
        border-2 border-teal-dark
      `,
      gray: `
        bg-transparent text-gray-600
        border-2 border-gray-300
      `,
    },
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-semibold rounded-full
        uppercase tracking-wider
        ${variants[variant][color]}
        ${sizes[size]}
        ${pulse ? 'animate-pulse-glow' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge3D;
