import type { HttpOperation } from '../../src/types.js';
import { describe, expect, it } from 'vitest';
import { normalizeHttpOperation } from '../../src/http-mapping.js';

describe('normalizeHttpOperation', () => {
	// Generic CRUD patterns
	it('pOST /collections → CollectionsService.createOne', () => {
		const op: HttpOperation = { method: 'POST', path: '/collections', body: { collection: 'articles' } };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'CollectionsService',
			action: 'createOne',
			body: { collection: 'articles' },
		});
	});

	it('gET /users/abc → UsersService.readOne', () => {
		const op: HttpOperation = { method: 'GET', path: '/users/abc', query: { fields: ['*'] } };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'UsersService',
			action: 'readOne',
			id_param: 'abc',
			query: { fields: ['*'] },
		});
	});

	it('pATCH /roles/abc → RolesService.updateOne', () => {
		const op: HttpOperation = { method: 'PATCH', path: '/roles/abc', body: { name: 'Editor' } };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'RolesService',
			action: 'updateOne',
			id_param: 'abc',
			body: { name: 'Editor' },
		});
	});

	it('dELETE /folders/abc → FoldersService.deleteOne', () => {
		const op: HttpOperation = { method: 'DELETE', path: '/folders/abc' };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'FoldersService',
			action: 'deleteOne',
			id_param: 'abc',
		});
	});

	it('gET /collections → CollectionsService.readByQuery', () => {
		const op: HttpOperation = { method: 'GET', path: '/collections', query: { limit: 10 } };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'CollectionsService',
			action: 'readByQuery',
			query: { limit: 10 },
		});
	});

	// Items special case
	it('pOST /items/articles → ItemsService.createOne with collection', () => {
		const op: HttpOperation = { method: 'POST', path: '/items/articles', body: { title: 'Hello' } };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'ItemsService',
			action: 'createOne',
			collection: 'articles',
			body: { title: 'Hello' },
		});
	});

	it('gET /items/articles/123 → ItemsService.readOne with collection', () => {
		const op: HttpOperation = { method: 'GET', path: '/items/articles/123' };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'ItemsService',
			action: 'readOne',
			collection: 'articles',
			id_param: '123',
		});
	});

	it('pATCH /items/articles/123 → ItemsService.updateOne with collection', () => {
		const op: HttpOperation = { method: 'PATCH', path: '/items/articles/123', body: { title: 'Updated' } };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'ItemsService',
			action: 'updateOne',
			collection: 'articles',
			id_param: '123',
			body: { title: 'Updated' },
		});
	});

	it('dELETE /items/articles/123 → ItemsService.deleteOne with collection', () => {
		const op: HttpOperation = { method: 'DELETE', path: '/items/articles/123' };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'ItemsService',
			action: 'deleteOne',
			collection: 'articles',
			id_param: '123',
		});
	});

	// Fields special case
	it('pOST /fields/articles → FieldsService.createField with collection', () => {
		const op: HttpOperation = { method: 'POST', path: '/fields/articles', body: { field: 'title', type: 'string' } };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'FieldsService',
			action: 'createField',
			collection: 'articles',
			body: { field: 'title', type: 'string' },
		});
	});

	it('pATCH /fields/articles/title → FieldsService.updateField', () => {
		const op: HttpOperation = { method: 'PATCH', path: '/fields/articles/title', body: { meta: { hidden: true } } };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'FieldsService',
			action: 'updateField',
			collection: 'articles',
			id_param: 'title',
			body: { meta: { hidden: true } },
		});
	});

	it('dELETE /fields/articles/title → FieldsService.deleteField', () => {
		const op: HttpOperation = { method: 'DELETE', path: '/fields/articles/title' };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'FieldsService',
			action: 'deleteField',
			collection: 'articles',
			id_param: 'title',
		});
	});

	// Relations special cases
	it('pATCH /relations/articles/author → RelationsService.updateOne', () => {
		const op: HttpOperation = { method: 'PATCH', path: '/relations/articles/author', body: { related_collection: 'users' } };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'RelationsService',
			action: 'updateOne',
			collection: 'articles',
			id_param: 'author',
			body: { related_collection: 'users' },
		});
	});

	it('dELETE /relations/articles/author → RelationsService.deleteOne', () => {
		const op: HttpOperation = { method: 'DELETE', path: '/relations/articles/author' };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'RelationsService',
			action: 'deleteOne',
			collection: 'articles',
			id_param: 'author',
		});
	});

	// Settings singleton
	it('pATCH /settings → SettingsService.upsertSingleton', () => {
		const op: HttpOperation = { method: 'PATCH', path: '/settings', body: { project_name: 'Test' } };
		const result = normalizeHttpOperation(op);

		expect(result).toEqual({
			service: 'SettingsService',
			action: 'upsertSingleton',
			body: { project_name: 'Test' },
		});
	});

	// Unsupported route
	it('throws for unsupported routes', () => {
		const op: HttpOperation = { method: 'POST', path: '/unknown/route' };
		expect(() => normalizeHttpOperation(op)).toThrow('not mapped');
	});
});
