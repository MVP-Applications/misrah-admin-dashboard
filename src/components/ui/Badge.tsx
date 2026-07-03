import React, { ReactNode } from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: string;
  className?: string;
  key?: React.Key;
}

export const Badge = ({ children, variant = 'gray', className = '', ...props }: BadgeProps) => {
  const styles: Record<string, string> = {
    green: 'bg-success/10 text-success',
    gold: 'bg-accent/15 text-accent',
    blue: 'bg-info/10 text-info',
    red: 'bg-danger/10 text-danger',
    danger: 'bg-danger/10 text-danger',
    gray: 'bg-muted-text/10 text-muted-text',
    primary: 'bg-primary text-accent',
  };
  return (
    <span 
      className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${styles[variant] || styles.gray} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
