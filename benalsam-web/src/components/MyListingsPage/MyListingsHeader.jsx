import React from 'react';
import { Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MyListingsHeader = ({ 
  selectedStatus, 
  onStatusChange, 
  statusConfig, 
  onCreateClick 
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">
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
              const Icon = config.icon;
              return (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button onClick={onCreateClick} className="btn-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Yeni İlan
        </Button>
      </div>
    </div>
  );
};

export default MyListingsHeader;