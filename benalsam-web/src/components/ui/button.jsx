import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
	'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default: 
          '[data-theme="light"]_&_:(bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-transparent) [data-theme="dark"]_&_:(bg-primary text-primary-foreground hover:bg-primary/90)',
				destructive:
          '[data-theme="light"]_&_:(bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-transparent) [data-theme="dark"]_&_:(bg-destructive text-destructive-foreground hover:bg-destructive/90)',
				outline:
          '[data-theme="light"]_&_:(border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm) [data-theme="dark"]_&_:(border border-input bg-background hover:bg-accent hover:text-accent-foreground)',
				secondary:
          '[data-theme="light"]_&_:(bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm border border-transparent) [data-theme="dark"]_&_:(bg-secondary text-secondary-foreground hover:bg-secondary/80)',
				ghost: 
          '[data-theme="light"]_&_:(hover:bg-accent hover:text-accent-foreground) [data-theme="dark"]_&_:(hover:bg-accent hover:text-accent-foreground)',
				link: 
          '[data-theme="light"]_&_:(text-secondary underline-offset-4 hover:underline hover:text-primary) [data-theme="dark"]_&_:(text-primary underline-offset-4 hover:underline)',
			},
			size: {
				default: 'h-9 px-4 py-2', // Amazon buttons are slightly shorter
				sm: 'h-8 rounded-md px-3', // And sm ones too
				lg: 'h-10 rounded-md px-8', // lg can be a bit shorter
				icon: 'h-9 w-9', // Icon buttons
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button';
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			ref={ref}
			{...props}
		/>
	);
});
Button.displayName = 'Button';

export { Button, buttonVariants };