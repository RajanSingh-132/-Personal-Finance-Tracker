import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className={`spinner ${sizeClasses[size]}`}></div>
      {text && (
        <p className="text-secondary text-sm">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
