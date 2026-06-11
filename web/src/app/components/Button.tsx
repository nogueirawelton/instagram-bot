import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-md transition-all duration-200',
          'disabled:opacity-40 disabled:pointer-events-none select-none',
          'active:scale-[0.97]',
          {
            'bg-primary text-primary-foreground hover:bg-[#006a9a] shadow-sm hover:shadow-md': variant === 'primary',
            'bg-white text-foreground border border-border hover:bg-muted hover:border-secondary shadow-sm': variant === 'secondary',
            'bg-accent text-accent-foreground hover:bg-[#a82541] shadow-sm hover:shadow-md': variant === 'accent',
            'text-foreground hover:bg-muted rounded-lg': variant === 'ghost',
            'bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20': variant === 'danger',
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2': size === 'md',
            'px-6 py-3': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
