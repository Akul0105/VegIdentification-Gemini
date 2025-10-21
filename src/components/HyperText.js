import React, { useState } from 'react';
import { cn } from '../lib/utils';

export function HyperText({ children, className, ...props }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <span
      className={cn(
        "relative inline-block cursor-pointer transition-all duration-300",
        isHovered && "transform scale-105",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <span
        className={cn(
          "relative z-10 transition-all duration-300",
          isHovered && "text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500"
        )}
      >
        {children}
      </span>
      {isHovered && (
        <span
          className="absolute inset-0 z-0 animate-pulse"
          style={{
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57)',
            backgroundSize: '400% 400%',
            animation: 'gradient 2s ease infinite',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'blur(1px)',
          }}
        >
          {children}
        </span>
      )}
      <style jsx>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </span>
  );
}
