'use client';

import { forwardRef, HTMLAttributes, useState } from 'react';

interface Card3DProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'clay' | 'glass' | 'glass-dark' | 'flat';
  hover?: 'lift' | 'tilt' | 'glow' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card3D = forwardRef<HTMLDivElement, Card3DProps>(
  (
    {
      children,
      variant = 'clay',
      hover = 'lift',
      padding = 'md',
      className = '',
      onMouseMove,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const [tiltStyle, setTiltStyle] = useState({ transform: '' });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hover === 'tilt') {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        setTiltStyle({
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`,
        });
      }
      onMouseMove?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hover === 'tilt') {
        setTiltStyle({ transform: '' });
      }
      onMouseLeave?.(e);
    };

    const variants = {
      clay: `
        bg-gradient-to-br from-white to-gray-50
        shadow-[8px_8px_16px_rgba(0,0,0,0.08),-4px_-4px_12px_rgba(255,255,255,0.9)]
        border border-white/50
      `,
      glass: `
        bg-white/75 backdrop-blur-xl
        shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),0_12px_24px_-8px_rgba(0,0,0,0.15)]
        border border-white/40
      `,
      'glass-dark': `
        bg-black/40 backdrop-blur-xl
        shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]
        border border-white/10
        text-white
      `,
      flat: `
        bg-white
        shadow-md
        border border-gray-100
      `,
    };

    const hovers = {
      lift: 'hover:shadow-[12px_12px_24px_rgba(0,0,0,0.12),-6px_-6px_16px_rgba(255,255,255,0.95)] hover:-translate-y-1',
      tilt: 'transform-gpu',
      glow: 'hover:shadow-[0_0_30px_rgba(140,158,255,0.3)]',
      none: '',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={`
          rounded-3xl
          transition-all duration-300 ease-out
          ${variants[variant]}
          ${hovers[hover]}
          ${paddings[padding]}
          ${className}
        `}
        style={hover === 'tilt' ? tiltStyle : undefined}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card3D.displayName = 'Card3D';

export default Card3D;
