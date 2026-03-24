import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export default function TechBackground() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-neutral-950">
      {/* Mouse Follow Glow */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, rgba(168, 85, 247, 0.15), transparent 80%)`
        }}
      />

      {/* Breathing glow effects (Purple-Blue + Pink) */}
      <motion.div
        animate={{
          opacity: [0.1, 0.3, 0.1],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          opacity: [0.1, 0.3, 0.1],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-pink-600/10 rounded-full blur-[150px]"
      />
      <motion.div
        animate={{
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px]"
      />

      {/* Moving Lines Background */}
      <svg className="absolute inset-0 w-full h-full opacity-40">
        <defs>
          <linearGradient id="lineGradPurple" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(168, 85, 247, 0)" />
            <stop offset="50%" stopColor="rgba(168, 85, 247, 0.6)" />
            <stop offset="100%" stopColor="rgba(168, 85, 247, 0)" />
          </linearGradient>
          <linearGradient id="lineGradPink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(236, 72, 153, 0)" />
            <stop offset="50%" stopColor="rgba(236, 72, 153, 0.5)" />
            <stop offset="100%" stopColor="rgba(236, 72, 153, 0)" />
          </linearGradient>
          <linearGradient id="lineGradBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.6)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
          </linearGradient>
        </defs>

        {/* Straight Lines */}
        <motion.line 
          x1="-10%" y1="20%" x2="110%" y2="20%" 
          stroke="url(#lineGradPurple)" strokeWidth="1"
          animate={{ y1: ["20%", "30%", "20%"], y2: ["20%", "30%", "20%"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <motion.line 
          x1="-10%" y1="80%" x2="110%" y2="80%" 
          stroke="url(#lineGradBlue)" strokeWidth="1"
          animate={{ y1: ["80%", "70%", "80%"], y2: ["80%", "70%", "80%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Diagonal Lines */}
        <motion.line 
          x1="0%" y1="-10%" x2="100%" y2="110%" 
          stroke="url(#lineGradPink)" strokeWidth="1"
          animate={{ x1: ["-10%", "10%", "-10%"], x2: ["90%", "110%", "90%"] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Curved Lines */}
        <motion.path 
          d="M -100 300 Q 400 100 900 400 T 2000 300" 
          fill="none" stroke="url(#lineGradBlue)" strokeWidth="1.5"
          animate={{ d: ["M -100 300 Q 400 100 900 400 T 2000 300", "M -100 300 Q 400 600 900 400 T 2000 300", "M -100 300 Q 400 100 900 400 T 2000 300"] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path 
          d="M -100 700 Q 500 900 1000 600 T 2000 700" 
          fill="none" stroke="url(#lineGradPurple)" strokeWidth="1"
          animate={{ d: ["M -100 700 Q 500 900 1000 600 T 2000 700", "M -100 700 Q 500 400 1000 600 T 2000 700", "M -100 700 Q 500 900 1000 600 T 2000 700"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
