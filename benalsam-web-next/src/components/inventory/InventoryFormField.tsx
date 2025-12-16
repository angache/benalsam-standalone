'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'

interface InventoryFormFieldProps {
  label: string
  icon?: LucideIcon
  children: React.ReactNode
  error?: string
}

const InventoryFormField: React.FC<InventoryFormFieldProps> = ({ label, icon: Icon, children, error }) => {
  const childId = React.Children.toArray(children)[0]?.props?.id || React.Children.toArray(children)[0]?.props?.name

  return (
    <div>
      <label htmlFor={childId} className="block text-sm font-medium text-foreground mb-1.5">
        {Icon && <Icon className="w-4 h-4 inline mr-1.5 text-primary" />} {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}

export default InventoryFormField

