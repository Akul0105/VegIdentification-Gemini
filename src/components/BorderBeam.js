import React, { useEffect, useRef } from 'react';

export function BorderBeam({ className, size = 200, duration = 15, borderWidth = 1.5, colorFrom = "#ffaa40", colorTo = "#9c40ff", delay = 0 }) {
  const divRef = useRef(null);

  useEffect(() => {
    const div = divRef.current;
    if (!div) return;

    const handleMouseMove = (e) => {
      const { left, top, width, height } = div.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      const centerX = width / 2;
      const centerY = height / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
      const intensity = 1 - distance / maxDistance;
      
      div.style.setProperty('--beam-opacity', intensity.toString());
    };

    div.addEventListener('mousemove', handleMouseMove);
    return () => div.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={divRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        '--beam-size': `${size}px`,
        '--beam-duration': `${duration}s`,
        '--beam-delay': `${delay}s`,
        '--beam-color-from': colorFrom,
        '--beam-color-to': colorTo,
        '--beam-opacity': '0',
      }}
    >
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{
          background: `conic-gradient(from 0deg, ${colorFrom}, ${colorTo}, ${colorFrom})`,
          mask: `radial-gradient(circle at var(--beam-x, 50%) var(--beam-y, 50%), transparent 0%, black 50%)`,
          WebkitMask: `radial-gradient(circle at var(--beam-x, 50%) var(--beam-y, 50%), transparent 0%, black 50%)`,
          animation: `border-beam ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
          opacity: 'var(--beam-opacity, 0)',
        }}
      />
      <style jsx>{`
        @keyframes border-beam {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
