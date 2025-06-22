
import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer = ({ children, className = '' }: PageContainerProps) => {
  return (
    <div className={`min-h-screen bg-finflow-dark ${className}`}>
      <div className="md:ml-64 pb-16 md:pb-0">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageContainer;
