/**
 * Recursively sanitizes input data to prevent:
 * 1. NoSQL Injection (strips object keys starting with '$')
 * 2. XSS (escapes HTML/Script tag characters in string inputs)
 */
export function sanitizeData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Escape HTML tag characters to prevent XSS/HTML injection, while keeping base64/URLs safe
    return data
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;') as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Strip any key starting with '$' to block MongoDB operator injection
      if (key.startsWith('$')) {
        console.warn(`[Security Alert] Stripped NoSQL injection candidate key: ${key}`);
        continue;
      }
      sanitizedObj[key] = sanitizeData(value);
    }
    return sanitizedObj as T;
  }

  return data;
}
