import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md hover:opacity-90 hover:shadow-lg",
        destructive:
          "bg-[var(--destructive)] text-[var(--destructive-foreground)] shadow-md hover:opacity-90",
        outline:
          "border border-[var(--border)] bg-transparent hover:bg-[var(--muted)] text-[var(--foreground)]",
        secondary:
          "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-80",
        ghost:
          "hover:bg-[var(--muted)] text-[var(--foreground)]",
        link:
          "text-[var(--primary)] underline-offset-4 hover:underline p-0 h-auto",
        gradient:
          "bg-gradient-to-r from-brand-600 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:opacity-95",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs rounded-md",
        lg: "h-12 px-8 text-base rounded-xl",
        xl: "h-14 px-10 text-lg rounded-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
