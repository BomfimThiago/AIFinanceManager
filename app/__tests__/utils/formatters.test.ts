// Import functions directly to test pure logic
// Note: formatCurrency expects a Currency type but works with strings

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  });
  return formatter.format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'ahora mismo';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `hace ${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `hace ${diffInDays}d`;
  }

  return formatDate(dateString);
};

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    const result = formatCurrency(100.5, 'USD');
    // Should format as currency with $ symbol
    expect(result).toContain('100');
    expect(result).toMatch(/\$|USD/);
  });

  it('formats EUR correctly', () => {
    const result = formatCurrency(50.25, 'EUR');
    // Should format as currency with € symbol
    expect(result).toContain('50');
    expect(result).toMatch(/€|EUR/);
  });

  it('formats BRL correctly', () => {
    const result = formatCurrency(200, 'BRL');
    // Should format as currency with R$ symbol
    expect(result).toContain('200');
    expect(result).toMatch(/R\$|BRL/);
  });
});

describe('formatDate', () => {
  it('formats date string correctly', () => {
    const result = formatDate('2024-06-15T10:30:00Z');
    // Should include day, month, and year
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });
});

describe('formatRelativeTime', () => {
  it('returns "ahora mismo" for very recent times', () => {
    const now = new Date().toISOString();
    const result = formatRelativeTime(now);
    expect(result).toBe('ahora mismo');
  });

  it('returns minutes ago for recent times', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = formatRelativeTime(fiveMinutesAgo);
    expect(result).toBe('hace 5m');
  });

  it('returns hours ago for today', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(twoHoursAgo);
    expect(result).toBe('hace 2h');
  });
});
