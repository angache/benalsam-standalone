// ===========================
// ADMIN-UI SPECIFIC TYPES
// ===========================

// Basic types for Admin UI
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  userId: string;
  category: string;
  images: string[];
  location: {
    province: string;
    district: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type ListingStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SOLD' | 'EXPIRED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface QueryFilters {
  search?: string;
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AnalyticsEvent {
  id: string;
  type: string;
  userId?: string;
  data: any;
  timestamp: string;
}

export type AnalyticsEventType = 'PAGE_VIEW' | 'CLICK' | 'SEARCH' | 'LOGIN' | 'LOGOUT';

// ===========================
// ADMIN-UI SPECIFIC TYPES
// ===========================

// UI Component Props
export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onRowClick?: (record: T) => void;
  rowKey?: keyof T | ((record: T) => string);
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'number' | 'date' | 'checkbox' | 'radio';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  validation?: {
    pattern?: RegExp;
    message?: string;
  };
}

export interface FormConfig {
  fields: FormField[];
  onSubmit: (values: any) => void;
  initialValues?: any;
  submitText?: string;
  loading?: boolean;
}

// Modal Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Chart Types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: ChartData;
  options?: any;
}

// Dashboard Widget Types
export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stat' | 'chart' | 'table' | 'list';
  data: any;
  config?: any;
  size?: 'small' | 'medium' | 'large';
  refreshInterval?: number;
}

// Filter Types
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'dateRange' | 'search';
  options?: FilterOption[];
  placeholder?: string;
}

// Breadcrumb Types
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

// Navigation Types
export interface NavItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  children?: NavItem[];
  permissions?: string[];
}

// Theme Types
export interface Theme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  border: string;
}

// API Hook Types
export interface UseApiOptions<T = any> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  enabled?: boolean;
}

export interface UseApiResult<T = any> {
  data: T | null;
  loading: boolean;
  error: any;
  refetch: () => void;
  mutate: (data: T) => void;
}

// Permission Hook Types
export interface UsePermissionsOptions {
  permissions?: string[];
  requireAll?: boolean;
}

export interface UsePermissionsResult {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  loading: boolean;
  error: any;
}

// Local Storage Types
export interface StorageItem<T = any> {
  key: string;
  value: T;
  expiresAt?: number;
}

// Error Boundary Types
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// Loading States
export interface LoadingState {
  loading: boolean;
  error?: string;
  retry?: () => void;
}

// Pagination Types
export interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => string;
}

// Search Types
export interface SearchConfig {
  placeholder: string;
  onSearch: (value: string) => void;
  onClear?: () => void;
  loading?: boolean;
  debounceMs?: number;
}

// Export Types
export interface ExportConfig {
  filename: string;
  data: any[];
  columns: {
    key: string;
    label: string;
    render?: (value: any) => string;
  }[];
  format: 'csv' | 'excel' | 'pdf';
}

// Bulk Action Types
export interface BulkAction<T = any> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  action: (selectedItems: T[]) => Promise<void>;
  confirm?: {
    title: string;
    message: string;
  };
  disabled?: (selectedItems: T[]) => boolean;
}

// Context Types
export interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  user: AdminUser | null;
  setUser: (user: AdminUser | null) => void;
  logout: () => void;
}

// Layout Types
export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'temporary' | 'persistent';
} 