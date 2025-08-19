import React from 'react';

interface LoaderSpinnerProps {
  border?: string;
  className?: string;
}

const ButtonLoader: React.FC<LoaderSpinnerProps> = ({
  border = 'white',
  className,
}) => {
  const defaultClass = `w-5 h-5 border-2 border-${border} border-t-transparent rounded-full animate-spin`;
  return <div className={className || defaultClass} />;
};

export default ButtonLoader;
