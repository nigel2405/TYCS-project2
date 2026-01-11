import React from 'react';
import { animateButtonRipple } from '../../utils/animations';

const GlassButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
}) => {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-500/30 to-primary-500/20 border-primary-500/50 hover:shadow-glow-primary hover:bg-gradient-to-r hover:from-primary-500/40 hover:to-primary-500/30',
    secondary: 'bg-gradient-to-r from-secondary-500/20 to-secondary-500/30 border-secondary-500/50 hover:shadow-glow-secondary',
    success: 'bg-gradient-to-r from-success-500/30 to-success-500/20 border-success-500/50 hover:shadow-lg hover:shadow-success-500/50',
    danger: 'bg-red-500/20 border-red-500/50 hover:shadow-lg hover:shadow-red-500/50',
  };

  const handleClick = (e) => {
    if (!disabled && onClick) {
      animateButtonRipple(e.currentTarget, e);
      if (onClick) {
        setTimeout(() => onClick(e), 100);
      }
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        glass-button relative overflow-hidden rounded-xl font-medium text-white
        border backdrop-blur-md transition-all duration-300
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default GlassButton;
