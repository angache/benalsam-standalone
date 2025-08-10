import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const MessageStatus = ({ status, isCurrentUser }) => {
  if (!isCurrentUser) {
    return null;
  }

  const iconClasses = "w-4 h-4";
  const iconStrokeWidth = 2.5;

  switch (status) {
    case 'sent':
      return <Check className={cn(iconClasses, "text-black dark:text-gray-400")} strokeWidth={iconStrokeWidth} />;
    case 'delivered':
      return <CheckCheck className={cn(iconClasses, "text-black dark:text-gray-400")} strokeWidth={iconStrokeWidth} />;
    case 'read':
      return <CheckCheck className={cn(iconClasses, "text-orange-700 dark:text-orange-500")} strokeWidth={iconStrokeWidth} />;
    default:
      return <Check className={cn(iconClasses, "text-black dark:text-gray-400")} strokeWidth={iconStrokeWidth} />;
  }
};

export default MessageStatus;