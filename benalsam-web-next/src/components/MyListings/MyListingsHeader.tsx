'use client'

import React from 'react'
import { Filter, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusConfig } from '@/lib/myListingsUtils'

interface MyListingsHeaderProps {
  selectedStatus: string
  onStatusChange: (status: string) => void
  statusConfig: Record<string, StatusConfig>
  onCreateClick: () => void
}

const MyListingsHeader = ({ 
  selectedStatus, 
  onStatusChange, 
  statusConfig, 
  onCreateClick 
}: MyListingsHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent mb-2">
          İlanlarım
        </h1>
        <p className="text-muted-foreground">
          Tüm ilanlarınızı buradan yönetebilirsiniz
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusConfig).map(([key, config]) => {
              const Icon = config.icon
              return (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <Button onClick={onCreateClick} className="bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Yeni İlan
        </Button>
      </div>
    </div>
  )
}

export default MyListingsHeader

