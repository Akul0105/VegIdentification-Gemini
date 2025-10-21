import React, { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

export function OrbitingCircles({ 
  children, 
  className, 
  iconSize = 40, 
  radius = 150, 
  reverse = false, 
  speed = 1 
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const circles = container.querySelectorAll('.orbiting-circle');
    let angle = 0;

    const animate = () => {
      angle += speed * (reverse ? -1 : 1);
      
      circles.forEach((circle, index) => {
        const circleAngle = angle + (index * (360 / circles.length));
        const x = Math.cos(circleAngle * Math.PI / 180) * radius;
        const y = Math.sin(circleAngle * Math.PI / 180) * radius;
        
        circle.style.transform = `translate(${x}px, ${y}px)`;
      });
      
      requestAnimationFrame(animate);
    };

    animate();
  }, [radius, reverse, speed]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-gray-400 rounded-full opacity-50" />
      </div>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="orbiting-circle absolute flex items-center justify-center"
          style={{
            width: `${iconSize}px`,
            height: `${iconSize}px`,
            transform: `translate(0px, 0px)`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
