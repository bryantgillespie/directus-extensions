import { describe, expect, it } from 'vitest';
import { resolveReferences } from '../../src/resolver.js';

describe('resolveReferences', () => {
	it('returns primitives as-is', () => {
		const scope = {};
		expect(resolveReferences('hello', scope)).toBe('hello');
		expect(resolveReferences(42, scope)).toBe(42);
		expect(resolveReferences(true, scope)).toBe(true);
		expect(resolveReferences(null, scope)).toBe(null);
	});

	it('replaces raw {{ key }} with original type', () => {
		const scope = { create_articles: 'articles' };
		expect(resolveReferences('{{ create_articles }}', scope)).toBe('articles');
	});

	it('preserves number type for raw replacement', () => {
		const scope = { step1: 42 };
		expect(resolveReferences('{{ step1 }}', scope)).toBe(42);
	});

	it('preserves object type for raw replacement', () => {
		const scope = { step1: { id: 1, name: 'test' } };
		expect(resolveReferences('{{ step1 }}', scope)).toEqual({ id: 1, name: 'test' });
	});

	it('preserves array type for raw replacement', () => {
		const scope = { step1: [1, 2, 3] };
		expect(resolveReferences('{{ step1 }}', scope)).toEqual([1, 2, 3]);
	});

	it('stringifies when embedded in larger string', () => {
		const scope = { step1: 'articles' };
		expect(resolveReferences('collection_{{ step1 }}_v2', scope)).toBe('collection_articles_v2');
	});

	it('stringifies objects when embedded', () => {
		const scope = { step1: { id: 1 } };
		const result = resolveReferences('result: {{ step1 }}', scope);
		expect(result).toBe('result: [object Object]');
	});

	it('resolves $last reference', () => {
		const scope = { $last: 'last_result' };
		expect(resolveReferences('{{ $last }}', scope)).toBe('last_result');
	});

	it('deep walks objects', () => {
		const scope = { step1: 'articles' };
		const input = {
			collection: '{{ step1 }}',
			body: { field: 'title', meta: { collection: '{{ step1 }}' } },
		};
		const result = resolveReferences(input, scope);

		expect(result).toEqual({
			collection: 'articles',
			body: { field: 'title', meta: { collection: 'articles' } },
		});
	});

	it('deep walks arrays', () => {
		const scope = { step1: 'articles' };
		const input = ['{{ step1 }}', 'static', '{{ step1 }}_v2'];
		const result = resolveReferences(input, scope);
		expect(result).toEqual(['articles', 'static', 'articles_v2']);
	});

	it('returns undefined reference as empty string in embedded context', () => {
		const scope = {};
		expect(resolveReferences('prefix_{{ missing }}_suffix', scope)).toBe('prefix__suffix');
	});

	it('returns undefined for raw reference to missing key', () => {
		const scope = {};
		expect(resolveReferences('{{ missing }}', scope)).toBeUndefined();
	});

	it('does not mutate the original input', () => {
		const scope = { step1: 'resolved' };
		const input = { a: '{{ step1 }}', b: { c: '{{ step1 }}' } };
		const original = structuredClone(input);
		resolveReferences(input, scope);
		expect(input).toEqual(original);
	});

	it('handles nested dot paths', () => {
		const scope = { step1: { name: 'articles' } };
		expect(resolveReferences('{{ step1.name }}', scope)).toBe('articles');
	});
});
