import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Stepper = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const stepIndex = index + 1;
        const isActive = stepIndex === currentStep;
        const isCompleted = stepIndex < currentStep;

        return (
          <React.Fragment key={step.name}>
            <div className="flex flex-col items-center">
              <motion.div
                animate={isCompleted ? 'completed' : isActive ? 'active' : 'inactive'}
                variants={{
                  completed: { scale: 1, backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' },
                  active: { scale: 1.1, backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' },
                  inactive: { scale: 1, backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' },
                }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300',
                  'relative z-10'
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : stepIndex}
              </motion.div>
              <p className={cn(
                  "text-xs mt-2 text-center",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
              )}>
                {step.name}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-auto h-0.5 relative -mx-1">
                <div className="absolute w-full h-full bg-muted top-1/2 -translate-y-1/2" />
                <motion.div
                  className="absolute w-full h-full bg-primary top-1/2 -translate-y-1/2"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: isCompleted || isActive ? 1 : 0 }}
                  style={{ transformOrigin: 'left' }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;