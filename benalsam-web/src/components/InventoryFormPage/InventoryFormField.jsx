import React from 'react';

const InventoryFormField = ({ label, icon: Icon, children, error }) => (
  <div>
    <label htmlFor={children?.props?.id || children?.props?.name} className="block text-sm font-medium text-foreground mb-1.5">
      {Icon && <Icon className="w-4 h-4 inline mr-1.5 text-primary" />} {label}
    </label>
    {children}
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

export default InventoryFormField;