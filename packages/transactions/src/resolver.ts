import { get, render } from 'micromustache';

const RAW_PATTERN = /^\{\{\s*([^}\s]+)\s*\}\}$/;

export function resolveReferences(value: unknown, scope: Record<string, unknown>): unknown {
	if (value === null || value === undefined) return value;

	if (typeof value === 'string') {
		// Raw replacement — entire string is a single {{ ref }}
		const rawMatch = value.match(RAW_PATTERN);

		if (rawMatch) {
			const key = rawMatch[1]!;
			return get(scope, key);
		}

		// Embedded replacement — stringifies values
		if (value.includes('{{')) {
			return render(value, scope);
		}

		return value;
	}

	if (Array.isArray(value)) {
		return value.map((item) => resolveReferences(item, scope));
	}

	if (typeof value === 'object') {
		const result: Record<string, unknown> = {};

		for (const [k, v] of Object.entries(value)) {
			result[k] = resolveReferences(v, scope);
		}

		return result;
	}

	return value;
}
