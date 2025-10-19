import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import React from 'react';
import { Button } from './button';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { LoadingSpinner } from './loading-spinner';
import { EmptyStateList } from './empty-state';

const dataTableVariants = cva(
  'w-full',
  {
    variants: {
      size: {
        sm: 'text-sm',
        default: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const DataTable = React.forwardRef(({ 
  className, 
  size,
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "Veri bulunamadı",
  searchable = false,
  searchPlaceholder = "Ara...",
  onSearch,
  pagination = false,
  pageSize = 10,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  ...props 
}, ref) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortColumn, setSortColumn] = React.useState(null);
  const [sortDirection, setSortDirection] = React.useState('asc');

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange?.(data.map((item, index) => index));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (index, checked) => {
    if (checked) {
      onSelectionChange?.([...selectedRows, index]);
    } else {
      onSelectionChange?.(selectedRows.filter(i => i !== index));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <EmptyStateList 
        title={emptyMessage}
        description="Henüz hiçbir veri eklenmemiş."
      />
    );
  }

  return (
    <div ref={ref} className={cn(dataTableVariants({ size, className }))} {...props}>
      {/* Search and Controls */}
      {(searchable || pagination) && (
        <div className="flex items-center justify-between mb-4">
          {searchable && (
            <div className="flex-1 max-w-sm">
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          )}
          
          {pagination && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Sayfa {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Sonraki
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {selectable && (
                <th className="w-12 p-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "p-3 text-left font-medium",
                    column.sortable && "cursor-pointer hover:bg-muted/75"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "border-t",
                  rowIndex % 2 === 0 ? "bg-background" : "bg-muted/25",
                  selectedRows.includes(rowIndex) && "bg-primary/10"
                )}
              >
                {selectable && (
                  <td className="w-12 p-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(rowIndex)}
                      onChange={(e) => handleSelectRow(rowIndex, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="p-3">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

DataTable.displayName = 'DataTable';

export { DataTable, dataTableVariants };
