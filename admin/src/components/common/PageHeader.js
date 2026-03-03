import React, { useEffect, useRef } from 'react';
import { animatePageLoad, animateTextReveal } from '../../utils/animations';

const PageHeader = ({ title, subtitle, className = '' }) => {
  const headerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  useEffect(() => {
    if (headerRef.current) {
      animatePageLoad(headerRef.current);
    }
    if (titleRef.current) {
      setTimeout(() => animateTextReveal(titleRef.current), 200);
    }
    if (subtitleRef.current) {
      setTimeout(() => animateTextReveal(subtitleRef.current), 400);
    }
  }, []);

  return (
    <div
      ref={headerRef}
      className={`bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-primary-500/20 backdrop-blur-xl border-b border-white/10 py-16 mb-12 relative overflow-hidden ${className}`}
      style={{ opacity: 0 }}
    >
      <div className="max-w-7xl mx-auto px-5 relative z-10">
        <h1
          ref={titleRef}
          className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent"
          style={{ opacity: 0 }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            ref={subtitleRef}
            className="text-white/80 text-xl"
            style={{ opacity: 0 }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 opacity-50" />
    </div>
  );
};

export default PageHeader;
