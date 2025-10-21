import React, { useEffect, useRef } from 'react';

export function FlickeringGrid({ 
  className, 
  squareSize = 4, 
  gridGap = 6, 
  color = '#6B7280', 
  maxOpacity = 0.5, 
  flickerChance = 0.1,
  height = 800,
  width = 800 
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    const squares = [];
    const numSquaresX = Math.floor(width / (squareSize + gridGap));
    const numSquaresY = Math.floor(height / (squareSize + gridGap));

    // Initialize squares
    for (let y = 0; y < numSquaresY; y++) {
      for (let x = 0; x < numSquaresX; x++) {
        squares.push({
          x: x * (squareSize + gridGap),
          y: y * (squareSize + gridGap),
          opacity: Math.random() * maxOpacity,
          flickering: Math.random() < flickerChance
        });
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      squares.forEach(square => {
        if (square.flickering) {
          square.opacity = Math.random() * maxOpacity;
        }
        
        ctx.fillStyle = color;
        ctx.globalAlpha = square.opacity;
        ctx.fillRect(square.x, square.y, squareSize, squareSize);
      });
      
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };

    animate();
  }, [squareSize, gridGap, color, maxOpacity, flickerChance, height, width]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
