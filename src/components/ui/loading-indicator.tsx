import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/i18n/translations';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message,
  size = 'md',
  fullScreen = false,
}) => {
  const { t } = useTranslation();
  const displayMessage = message || t('common.loading');

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={containerClasses}
    >
      <div className="flex flex-col items-center gap-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className={`${sizeClasses[size]} text-primary animate-spin`} />
        </motion.div>
        <p className="text-sm text-muted-foreground">{displayMessage}</p>
      </div>
    </motion.div>
  );
}; 