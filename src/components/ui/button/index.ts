import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

export { default as Button } from './Button.vue';

export const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
    {
        variants: {
            variant: {
                default:
          'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
                destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
                outline:
          'border border-border bg-background hover:bg-muted hover:text-foreground active:bg-muted/80',
                secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
                ghost:
          'hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
                link: 'text-primary underline-offset-4 hover:underline',
                // WeWeb specific variants
                brand:
          'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
                success:
          'bg-success text-success-foreground hover:bg-success/90 active:bg-success/80',
                warning:
          'bg-warning text-warning-foreground hover:bg-warning/90 active:bg-warning/80',
                binding:
          'bg-binding text-binding-foreground hover:bg-binding/90 active:bg-binding/80',
            },
            size: {
                default: 'h-7 px-3 py-1.5', // 28px height to match WeWeb
                sm: 'h-6 px-2 py-1', // 24px height to match WeWeb
                lg: 'h-8 px-4 py-2', // 32px height to match WeWeb
                icon: 'size-7', // Square icon button
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
