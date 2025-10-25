import React from 'react';
import { motion } from 'framer-motion';

const veggies = ['🥬','🥕','🍅','🥔','🧅','🥒','🌶️','🥦','🍄','🌽','🥑','🍆'];

const positions = [
  { left: '5%', size: '4rem', duration: 25, delay: 0 },
  { left: '15%', size: '3rem', duration: 30, delay: 3 },
  { left: '25%', size: '4.5rem', duration: 28, delay: 6 },
  { left: '35%', size: '3.5rem', duration: 32, delay: 9 },
  { left: '45%', size: '4rem', duration: 26, delay: 12 },
  { left: '55%', size: '3rem', duration: 34, delay: 15 },
  { left: '65%', size: '5rem', duration: 29, delay: 18 },
  { left: '75%', size: '3.5rem', duration: 31, delay: 21 },
  { left: '85%', size: '3rem', duration: 27, delay: 24 },
  { left: '12%', size: '3.5rem', duration: 33, delay: 10 },
  { left: '58%', size: '4rem', duration: 30, delay: 8 },
  { left: '82%', size: '4.5rem', duration: 28, delay: 4 },
];

export default function FloatingVeggies() {
  return (
    <div className="veg-layer" aria-hidden="true">
      {positions.map((pos, idx) => (
        <motion.span
          key={idx}
          className="veg-float"
          initial={{ y: '100vh', opacity: 0, rotate: 0 }}
          animate={{ 
            y: '-100vh', 
            opacity: [0, 0.7, 0.7, 0],
            rotate: 360,
          }}
          transition={{
            duration: pos.duration,
            delay: pos.delay,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ 
            left: pos.left, 
            fontSize: pos.size,
            position: 'absolute',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))'
          }}
        >
          {veggies[idx % veggies.length]}
        </motion.span>
      ))}
    </div>
  );
}
