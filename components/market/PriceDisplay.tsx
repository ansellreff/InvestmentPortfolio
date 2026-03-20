'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceDisplayProps {
  price: number;
  previousPrice?: number;
  change?: number;
  changePercent?: number;
  currency?: string;
  showIcon?: boolean;
  showChange?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

type PriceDirection = 'up' | 'down' | 'neutral';

/**
 * PriceDisplay - Animated price display with visual feedback
 *
 * Features:
 * - Flash animation on price change
 * - Color-coded background transitions
 * - Smooth number transitions
 * - Live indicator for real-time updates
 */
export function PriceDisplay({
  price,
  previousPrice: propPreviousPrice,
  change,
  changePercent,
  currency = '',
  showIcon = true,
  showChange = true,
  className = '',
  size = 'md'
}: PriceDisplayProps) {
  const [displayPrice, setDisplayPrice] = useState(price);
  const [direction, setDirection] = useState<PriceDirection>('neutral');
  const [isAnimating, setIsAnimating] = useState(false);
  const [flashClass, setFlashClass] = useState('');
  const previousPriceRef = useRef(propPreviousPrice || price);

  // Determine if price went up or down
  useEffect(() => {
    if (price !== displayPrice && price !== previousPriceRef.current) {
      const newDirection = price > previousPriceRef.current ? 'up' : price < previousPriceRef.current ? 'down' : 'neutral';
      setDirection(newDirection);

      // Trigger animations
      setIsAnimating(true);
      setFlashClass(newDirection === 'up' ? 'flash-green' : newDirection === 'down' ? 'flash-red' : '');

      // Clear animations after delay
      const animTimeout = setTimeout(() => setIsAnimating(false), 600);
      const flashTimeout = setTimeout(() => setFlashClass(''), 500);

      // Update display price with animation
      animatePriceChange(previousPriceRef.current, price);

      previousPriceRef.current = price;

      return () => {
        clearTimeout(animTimeout);
        clearTimeout(flashTimeout);
      };
    }
  }, [price]);

  // Smooth number animation
  const animatePriceChange = (from: number, to: number) => {
    const duration = 400;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;

      setDisplayPrice(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayPrice(to);
      }
    };

    requestAnimationFrame(animate);
  };

  // Determine change percent if not provided
  const actualChangePercent = changePercent !== undefined ? changePercent :
    (previousPriceRef.current > 0 ? ((price - previousPriceRef.current) / previousPriceRef.current) * 100 : 0);

  const isUp = actualChangePercent >= 0;

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className={`price-display ${flashClass} ${className}`}>
      <style jsx>{`
        .price-display {
          transition: all 0.3s ease;
          border-radius: 8px;
          padding: 4px 8px;
          display: inline-block;
        }

        .flash-green {
          animation: flashGreen 0.5s ease-out;
        }

        .flash-red {
          animation: flashRed 0.5s ease-out;
        }

        @keyframes flashGreen {
          0% {
            background-color: rgba(34, 197, 94, 0.3);
            transform: scale(1.02);
          }
          100% {
            background-color: transparent;
            transform: scale(1);
          }
        }

        @keyframes flashRed {
          0% {
            background-color: rgba(239, 68, 68, 0.3);
            transform: scale(1.02);
          }
          100% {
            background-color: transparent;
            transform: scale(1);
          }
        }

        .price-value {
          transition: color 0.2s ease;
        }

        .price-value.pulse-up {
          animation: pulseGreen 0.4s ease-out;
        }

        .price-value.pulse-down {
          animation: pulseRed 0.4s ease-out;
        }

        @keyframes pulseGreen {
          0%, 100% { color: inherit; }
          50% { color: rgb(34, 197, 94); }
        }

        @keyframes pulseRed {
          0%, 100% { color: inherit; }
          50% { color: rgb(239, 68, 68); }
        }

        .change-indicator {
          transition: all 0.3s ease;
        }

        .change-indicator.up {
          color: rgb(34, 197, 94);
        }

        .change-indicator.down {
          color: rgb(239, 68, 68);
        }
      `}</style>

      <div className="flex items-center gap-2">
        {/* Price */}
        <span className={`font-bold tabular-nums price-value ${sizeClasses[size]} ${isAnimating ? (direction === 'up' ? 'pulse-up' : direction === 'down' ? 'pulse-down' : '') : ''}`}>
          {currency ? `${currency} ` : ''}{displayPrice.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>

        {/* Change indicator */}
        {showChange && actualChangePercent !== 0 && (
          <span className={`change-indicator flex items-center gap-1 ${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium ${isUp ? 'up' : 'down'}`}>
            {showIcon && (isUp ? <TrendingUp className={iconSize[size]} /> : <TrendingDown className={iconSize[size]} />)}
            {isUp ? '+' : ''}{actualChangePercent.toFixed(2)}%
          </span>
        )}

        {/* Neutral indicator for no change */}
        {showChange && actualChangePercent === 0 && showIcon && (
          <span className="text-slate-400">
            <Minus className={iconSize[size]} />
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * CompactPriceDisplay - Smaller version for cards and tables
 */
interface CompactPriceDisplayProps {
  price: number;
  changePercent?: number;
  currency?: string;
  className?: string;
}

export function CompactPriceDisplay({
  price,
  changePercent = 0,
  currency = '',
  className = ''
}: CompactPriceDisplayProps) {
  const [prevPrice, setPrevPrice] = useState(price);
  const [flashClass, setFlashClass] = useState('');

  useEffect(() => {
    if (price !== prevPrice) {
      setFlashClass(price > prevPrice ? 'bg-green-500/20' : 'bg-red-500/20');
      setPrevPrice(price);

      const timeout = setTimeout(() => setFlashClass(''), 400);
      return () => clearTimeout(timeout);
    }
  }, [price, prevPrice]);

  const isUp = changePercent >= 0;

  return (
    <div className={`transition-colors duration-200 rounded px-2 py-1 ${flashClass} ${className}`}>
      <span className="font-semibold tabular-nums">
        {currency}{price.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </span>
      {changePercent !== 0 && (
        <span className={`ml-1 text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
          {isUp ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      )}
    </div>
  );
}
