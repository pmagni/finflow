
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  decimals?: number;
  className?: string;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, decimals = 0, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const formatNumber = (num: number): string => {
      return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num);
    };

    const parseNumber = (str: string): number => {
      const cleanStr = str.replace(/[^\d,]/g, '').replace(',', '.');
      return cleanStr ? parseFloat(cleanStr) : 0;
    };

    useEffect(() => {
      if (!isFocused) {
        setDisplayValue(value > 0 ? formatNumber(value) : '');
      }
    }, [value, isFocused, decimals]);

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
        inputMode="decimal"
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

NumberInput.displayName = "NumberInput";
