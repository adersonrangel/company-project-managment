import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { buttonVariants } from './buttonVariants';

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export default Button;
