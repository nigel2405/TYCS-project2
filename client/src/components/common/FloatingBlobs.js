import React, { useEffect, useRef } from 'react';
import { animateFloatingBlobs } from '../../utils/animations';

const FloatingBlobs = () => {
  const blobsRef = useRef([]);

  useEffect(() => {
    if (blobsRef.current.length > 0) {
      animateFloatingBlobs(blobsRef.current);
    }
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div
        ref={(el) => (blobsRef.current[0] = el)}
        className="floating-blob w-96 h-96 top-20 left-20"
        style={{ background: 'linear-gradient(135deg, rgba(37, 204, 247, 0.15), rgba(85, 230, 193, 0.15))' }}
      />
      <div
        ref={(el) => (blobsRef.current[1] = el)}
        className="floating-blob w-80 h-80 bottom-20 right-20"
        style={{ background: 'linear-gradient(135deg, rgba(85, 230, 193, 0.15), rgba(37, 204, 247, 0.15))' }}
      />
      <div
        ref={(el) => (blobsRef.current[2] = el)}
        className="floating-blob w-72 h-72 top-1/2 right-1/4"
        style={{ background: 'linear-gradient(135deg, rgba(37, 204, 247, 0.1), rgba(88, 177, 159, 0.1))' }}
      />
    </div>
  );
};

export default FloatingBlobs;
