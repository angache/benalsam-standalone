import React from "react";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef(({ 
  className, 
  checked, 
  onCheckedChange, 
  disabled = false,
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative inline-flex w-9 cursor-pointer items-center rounded-full border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-blue-500": "bg-gray-600",
        className
      )}
      style={{ 
        height: '24px',
        minHeight: '24px',
        maxHeight: '24px'
      }}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white transition-transform duration-200 shadow-md",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
});

Switch.displayName = 'Switch';

export { Switch };