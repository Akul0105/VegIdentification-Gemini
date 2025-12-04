import React from "react";
import { motion } from "framer-motion";

export function ShimmerButton({ children, onClick, disabled, className = "", variant = "primary" }) {
  const variants = {
    primary: 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 hover:from-green-500 hover:via-emerald-600 hover:to-teal-700',
    secondary: 'bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-600 hover:from-blue-500 hover:via-cyan-600 hover:to-blue-700',
    danger: 'bg-gradient-to-br from-red-400 via-rose-500 to-red-600 hover:from-red-500 hover:via-rose-600 hover:to-red-700',
    warning: 'bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 hover:from-orange-500 hover:via-amber-600 hover:to-orange-700',
    success: 'bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 hover:from-emerald-500 hover:via-green-600 hover:to-emerald-700'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-2xl px-8 py-4 font-bold text-lg
        text-white shadow-2xl transition-all duration-300
        border-2 border-white/20
        ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-400' : variants[variant]}
        ${className}
      `}
      style={{
        boxShadow: disabled ? 'none' : '0 10px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.2)'
      }}
    >
      {!disabled && (
        <>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            animate={{
              x: ['-200%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 100% 100%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)'
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </>
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

