import React, { useEffect, useRef } from 'react';
import { animateShimmer } from '../../utils/animations';

const SkeletonLoader = ({ className = '' }) => {
  const shimmerRef = useRef(null);

  useEffect(() => {
    if (shimmerRef.current) {
      animateShimmer(shimmerRef.current);
    }
  }, []);

  return (
    <div
      ref={shimmerRef}
      className={`shimmer glass-card rounded-xl ${className}`}
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
};

export default SkeletonLoader;
