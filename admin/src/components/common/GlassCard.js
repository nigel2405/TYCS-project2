import React, { useEffect, useRef, forwardRef } from 'react';
import { animateCardHover } from '../../utils/animations';

const GlassCard = forwardRef(({ children, className = '', onClick, cursorGlow = false }, ref) => {
  const cardRef = useRef(null);
  const glowRef = useRef(null);

  // Use forwarded ref or internal ref
  const actualRef = ref || cardRef;

  useEffect(() => {
    const card = actualRef.current;
    if (!card) return;

    const handleMouseEnter = () => animateCardHover(card, true);
    const handleMouseLeave = () => animateCardHover(card, false);
    const handleMouseMove = (e) => {
      if (cursorGlow && glowRef.current) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        glowRef.current.style.left = `${x}px`;
        glowRef.current.style.top = `${y}px`;
      }
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);
    if (cursorGlow) {
      card.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
      if (cursorGlow) {
        card.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [cursorGlow, actualRef]);

  return (
    <div
      ref={actualRef}
      className={`glass-card rounded-2xl p-6 relative overflow-hidden ${cursorGlow ? 'cursor-glow' : ''} ${className}`}
      onClick={onClick}
    >
      {cursorGlow && (
        <div
          ref={glowRef}
          className="absolute w-64 h-64 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-full blur-3xl pointer-events-none -z-10 transition-all duration-300"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        />
      )}
      {children}
    </div>
  );
});

GlassCard.displayName = 'GlassCard';

export default GlassCard;
