/**
 * Check if a value is a valid URL
 */
export function isUrl(value: any): boolean {
	if (typeof value !== 'string') return false;

	// Only treat as URL if it starts with http:// or https://
	if (!value.startsWith('http://') && !value.startsWith('https://')) {
		return false;
	}

	try {
		new URL(value);
		return true;
	}
	catch {
		return false;
	}
}

/**
 * Check if a value is a valid email address
 */
export function isEmail(value: any): boolean {
	if (typeof value !== 'string') return false;
	// Simple email regex that matches most valid emails
	const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;
	return emailRegex.test(value);
}
