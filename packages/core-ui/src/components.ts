// Core UI Components for Akazify Operator Interface
// These are placeholder implementations - replace with actual UI framework components

export interface BaseComponentProps {
  className?: string;
  children?: any;
}

// Button Component (enhanced version)
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    onClick,
    children,
    className = ''
  } = props;

  // Enhanced placeholder implementation - replace with actual component
  return {
    type: 'button',
    props: { variant, size, disabled, loading, onClick, className },
    children,
    render: () => `<button class="${variant} ${size} ${disabled ? 'disabled' : ''} ${className}">${children}</button>`
  } as any;
}

// Status Indicator Component
export interface StatusProps extends BaseComponentProps {
  status: 'operational' | 'warning' | 'error' | 'offline' | 'maintenance';
  label?: string;
}

export function Status(props: StatusProps) {
  const { status, label, className = '' } = props;

  const statusConfig = {
    operational: { color: 'green', text: 'Operational' },
    warning: { color: 'yellow', text: 'Warning' },
    error: { color: 'red', text: 'Error' },
    offline: { color: 'gray', text: 'Offline' },
    maintenance: { color: 'blue', text: 'Maintenance' }
  };

  const config = statusConfig[status];

  return {
    type: 'status',
    props: { status, label: label || config.text, className },
    render: () => `<div class="status ${status} ${className}">${label || config.text}</div>`
  } as any;
}

// Card Component
export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  actions?: any[];
}

export function Card(props: CardProps) {
  const { title, subtitle, actions = [], children, className = '' } = props;

  return {
    type: 'card',
    props: { title, subtitle, actions, className },
    children,
    render: () => `
      <div class="card ${className}">
        ${title ? `<h3 class="card-title">${title}</h3>` : ''}
        ${subtitle ? `<p class="card-subtitle">${subtitle}</p>` : ''}
        <div class="card-content">${children}</div>
        ${actions.length > 0 ? `<div class="card-actions">${actions.join('')}</div>` : ''}
      </div>
    `
  } as any;
}

// Metric Display Component
export interface MetricProps extends BaseComponentProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'error';
}

export function Metric(props: MetricProps) {
  const { label, value, unit, trend, status = 'good', className = '' } = props;

  return {
    type: 'metric',
    props: { label, value, unit, trend, status, className },
    render: () => `
      <div class="metric ${status} ${className}">
        <div class="metric-label">${label}</div>
        <div class="metric-value">${value}${unit ? ' ' + unit : ''}</div>
        ${trend ? `<div class="metric-trend ${trend}"></div>` : ''}
      </div>
    `
  } as any;
}

// Production Order Card Component
export interface ProductionOrderCardProps extends BaseComponentProps {
  orderNumber: string;
  productName: string;
  quantity: number;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  progress?: number; // 0-100
  dueDate?: string;
  actions?: any[];
}

export function ProductionOrderCard(props: ProductionOrderCardProps) {
  const {
    orderNumber,
    productName,
    quantity,
    status,
    progress = 0,
    dueDate,
    actions = [],
    className = ''
  } = props;

  return {
    type: 'production-order-card',
    props: { orderNumber, productName, quantity, status, progress, dueDate, actions, className },
    render: () => `
      <div class="production-order-card ${status} ${className}">
        <div class="order-header">
          <span class="order-number">${orderNumber}</span>
          <span class="order-status ${status}">${status.replace('-', ' ')}</span>
        </div>
        <div class="order-details">
          <div class="product-name">${productName}</div>
          <div class="quantity">Qty: ${quantity}</div>
          ${dueDate ? `<div class="due-date">Due: ${dueDate}</div>` : ''}
        </div>
        ${progress > 0 ? `
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span class="progress-text">${progress}%</span>
          </div>
        ` : ''}
        ${actions.length > 0 ? `<div class="order-actions">${actions.join('')}</div>` : ''}
      </div>
    `
  } as any;
}

// Equipment Status Component
export interface EquipmentStatusProps extends BaseComponentProps {
  name: string;
  code: string;
  status: 'operational' | 'down' | 'maintenance' | 'offline';
  efficiency?: number; // OEE percentage
  lastUpdated?: string;
}

export function EquipmentStatus(props: EquipmentStatusProps) {
  const {
    name,
    code,
    status,
    efficiency,
    lastUpdated,
    className = ''
  } = props;

  return {
    type: 'equipment-status',
    props: { name, code, status, efficiency, lastUpdated, className },
    render: () => `
      <div class="equipment-status ${status} ${className}">
        <div class="equipment-header">
          <span class="equipment-name">${name}</span>
          <span class="equipment-code">${code}</span>
        </div>
        <div class="equipment-details">
          <span class="status-indicator ${status}"></span>
          <span class="status-text">${status}</span>
          ${efficiency !== undefined ? `<span class="efficiency">OEE: ${efficiency}%</span>` : ''}
        </div>
        ${lastUpdated ? `<div class="last-updated">Updated: ${lastUpdated}</div>` : ''}
      </div>
    `
  } as any;
}

// Quick Action Button Component
export interface QuickActionProps extends BaseComponentProps {
  icon?: string;
  label: string;
  onClick: () => void;
  variant?: 'start' | 'stop' | 'pause' | 'complete' | 'maintenance';
  disabled?: boolean;
}

export function QuickAction(props: QuickActionProps) {
  const {
    icon,
    label,
    onClick,
    variant = 'primary',
    disabled = false,
    className = ''
  } = props;

  return {
    type: 'quick-action',
    props: { icon, label, onClick, variant, disabled, className },
    render: () => `
      <button
        class="quick-action ${variant} ${disabled ? 'disabled' : ''} ${className}"
        onclick="${onClick}"
        ${disabled ? 'disabled' : ''}
      >
        ${icon ? `<span class="icon">${icon}</span>` : ''}
        <span class="label">${label}</span>
      </button>
    `
  } as any;
}
