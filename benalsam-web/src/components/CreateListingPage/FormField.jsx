import React from 'react';

const FormField = ({ label, icon: Icon, children, error }) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-1.5">
      {Icon && <Icon className="w-4 h-4 inline mr-2 text-primary" />} {label}
    </label>
    {children}
    {error && <p className="text-destructive text-xs mt-1">{error}</p>}
  </div>
);

export default FormField;