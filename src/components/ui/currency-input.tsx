
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  className?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, currency = 'CLP', className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const formatNumber = (amount: number): string => {
      return new Intl.NumberFormat('es-CL').format(amount);
    };

    const parseNumber = (str: string): number => {
      const cleanStr = str.replace(/[^\d]/g, '');
      return cleanStr ? parseInt(cleanStr, 10) : 0;
    };

    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(value > 0 ? formatNumber(value) : '');
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setDisplayValue(inputValue);
      
      const numericValue = parseNumber(inputValue);
      if (!isNaN(numericValue)) {
        onChange(numericValue);
      }
    };

    const handleFocus = () => {
      setIsFocused(true);
      setDisplayValue(value > 0 ? value.toString() : '');
    };

    const handleBlur = () => {
      setIsFocused(false);
      setDisplayValue(value > 0 ? formatNumber(value) : '');
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn("text-right", className)}
        placeholder="0"
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
