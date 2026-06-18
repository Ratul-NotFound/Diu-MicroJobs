/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date to relative time (e.g., "2 hours ago", "3 days ago")
 */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
}

/**
 * Format currency in BDT
 */
export function formatCurrency(amount: number, currency: string = 'BDT'): string {
  if (currency === 'BDT') {
    return `৳${amount.toLocaleString('en-BD')}`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}

/**
 * Format budget range for display
 */
export function formatBudget(budget: { type: string; min: number; max?: number; currency?: string }): string {
  const curr = budget.currency || 'BDT';
  if (budget.type === 'fixed') {
    return formatCurrency(budget.min, curr);
  }
  if (budget.type === 'hourly') {
    return `${formatCurrency(budget.min, curr)}/hr`;
  }
  if (budget.type === 'range' && budget.max) {
    return `${formatCurrency(budget.min, curr)} - ${formatCurrency(budget.max, curr)}`;
  }
  return formatCurrency(budget.min, curr);
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Generate initials from a name
 */
export function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return parts
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Create a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get status color CSS class based on status string
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    draft: 'muted',
    pending_review: 'warning',
    open: 'success',
    in_review: 'warning',
    accepted: 'success',
    contracted: 'primary',
    in_progress: 'primary',
    delivered: 'accent',
    revision_requested: 'warning',
    completed: 'success',
    cancelled: 'muted',
    disputed: 'error',
    rejected: 'error',
    pending: 'warning',
    shortlisted: 'accent',
    withdrawn: 'muted',
    active: 'success',
    inactive: 'muted',
    suspended: 'warning',
    banned: 'error',
  };

  return statusColors[status] || 'muted';
}

/**
 * Format status string for display (e.g., "pending_review" → "Pending Review")
 */
export function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Validate DIU email domain
 */
export function isDiuEmail(email: string): boolean {
  const diuDomains = ['@diu.edu.bd', '@daffodilvarsity.edu.bd', '@s.diu.edu.bd'];
  return diuDomains.some((domain) => email.toLowerCase().endsWith(domain));
}

/**
 * Generate a random color for avatar fallback
 */
export function getAvatarColor(name?: string | null): string {
  const colors = [
    '#034ea2', '#00a651', '#e74c3c', '#f39c12', '#9b59b6',
    '#1abc9c', '#3498db', '#e67e22', '#2ecc71', '#e91e63',
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
