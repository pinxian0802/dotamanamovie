import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';

interface DataMatrixLoaderProps {
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function DataMatrixLoader({ text = 'PROCESSING...', className, size = 'md' }: DataMatrixLoaderProps) {
  const [matrixText, setMatrixText] = useState('');
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-32 h-32'
  };

  useEffect(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
    let interval: NodeJS.Timeout;

    const generateMatrix = () => {
      let result = '';
      for (let i = 0; i < 15; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setMatrixText(result);
    };

    interval = setInterval(generateMatrix, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={clsx("flex flex-col items-center justify-center gap-3", className)}>
      <div className={clsx("relative flex items-center justify-center", sizeClasses[size])}>
        {/* Outer spinning ring */}
        <div className="absolute inset-0 border-2 border-orange-500/20 rounded-full border-t-orange-500 animate-spin" style={{ animationDuration: '3s' }}></div>
        {/* Inner spinning ring */}
        <div className="absolute inset-2 border-2 border-indigo-500/20 rounded-full border-b-indigo-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
        {/* Core glow */}
        <div className="absolute inset-4 bg-orange-500/20 rounded-full blur-md animate-pulse"></div>
        {/* Matrix text center */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
          <span className={clsx("font-mono text-orange-400 opacity-80 break-all leading-none text-center px-1", size === 'lg' ? 'text-xs' : 'text-[8px]')}>
            {matrixText}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col items-center">
        <span className={clsx("font-mono text-orange-400 tracking-widest animate-pulse", size === 'lg' ? 'text-lg' : 'text-sm')}>
          {text}
        </span>
        <div className={clsx("bg-neutral-800 mt-2 rounded-full overflow-hidden relative", size === 'lg' ? 'w-64 h-2' : 'w-32 h-1')}>
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-indigo-500 w-1/2 animate-[slide_1.5s_ease-in-out_infinite_alternate]"></div>
        </div>
      </div>
    </div>
  );
}
