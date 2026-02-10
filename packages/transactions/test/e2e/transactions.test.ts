import { afterEach, describe, expect, it } from 'vitest';
import { cleanupCollection, collectionExists, directusRequest, txRequest } from './setup.js';

const TEST_COLLECTION = 'test_tx_articles';
const TEST_COLLECTION_2 = 'test_tx_posts';

afterEach(async () => {
	await cleanupCollection(TEST_COLLECTION);
	await cleanupCollection(TEST_COLLECTION_2);
});

describe('transactions e2e', () => {
	it('creates a collection and field in one transaction', async () => {
		const { status, body } = await txRequest([
			{
				id: 'create_col',
				service: 'CollectionsService',
				action: 'createOne',
				body: {
					collection: TEST_COLLECTION,
					meta: { icon: 'article' },
					schema: {},
					fields: [
						{ field: 'id', type: 'integer', meta: { hidden: true, interface: 'input', readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
					],
				},
			},
			{
				id: 'add_title',
				service: 'FieldsService',
				action: 'createField',
				collection: TEST_COLLECTION,
				body: { field: 'title', type: 'string', schema: {}, meta: { interface: 'input' } },
			},
		]);

		expect(status).toBe(200);
		expect(body.data.status).toBe('ok');
		expect(body.data.results).toHaveLength(2);
		expect(body.data.results[0].status).toBe('ok');
		expect(body.data.results[1].status).toBe('ok');

		// Verify collection exists
		expect(await collectionExists(TEST_COLLECTION)).toBe(true);
	});

	it('creates items in a collection', async () => {
		// First create the collection
		await directusRequest('POST', '/collections', {
			collection: TEST_COLLECTION,
			meta: {},
			schema: {},
			fields: [
				{ field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
				{ field: 'title', type: 'string', schema: {}, meta: {} },
			],
		});

		const { status, body } = await txRequest([
			{
				id: 'item1',
				service: 'ItemsService',
				action: 'createOne',
				collection: TEST_COLLECTION,
				body: { title: 'First' },
			},
			{
				id: 'item2',
				service: 'ItemsService',
				action: 'createOne',
				collection: TEST_COLLECTION,
				body: { title: 'Second' },
			},
		]);

		expect(status).toBe(200);
		expect(body.data.results).toHaveLength(2);
		expect(body.data.results[0].status).toBe('ok');
		expect(body.data.results[1].status).toBe('ok');
	});

	it('resolves operation references', async () => {
		const { status, body } = await txRequest([
			{
				id: 'create_col',
				service: 'CollectionsService',
				action: 'createOne',
				body: {
					collection: TEST_COLLECTION,
					meta: {},
					schema: {},
					fields: [
						{ field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
					],
				},
			},
			{
				id: 'add_field',
				service: 'FieldsService',
				action: 'createField',
				collection: '{{ create_col }}',
				body: { field: 'title', type: 'string', schema: {}, meta: {} },
			},
		]);

		expect(status).toBe(200);
		expect(body.data.status).toBe('ok');
		expect(body.data.results).toHaveLength(2);
	});

	it('supports HTTP-like format', async () => {
		const { status, body } = await txRequest([
			{
				id: 'create_col',
				method: 'POST',
				path: '/collections',
				body: {
					collection: TEST_COLLECTION,
					meta: {},
					schema: {},
					fields: [
						{ field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
					],
				},
			},
		]);

		expect(status).toBe(200);
		expect(body.data.status).toBe('ok');
		expect(await collectionExists(TEST_COLLECTION)).toBe(true);
	});

	it('supports mixed formats in one request', async () => {
		const { status, body } = await txRequest([
			{
				id: 'create_col',
				method: 'POST',
				path: '/collections',
				body: {
					collection: TEST_COLLECTION,
					meta: {},
					schema: {},
					fields: [
						{ field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
						{ field: 'title', type: 'string', schema: {}, meta: {} },
					],
				},
			},
			{
				id: 'create_item',
				service: 'ItemsService',
				action: 'createOne',
				collection: TEST_COLLECTION,
				body: { title: 'Hello' },
			},
		]);

		expect(status).toBe(200);
		expect(body.data.results).toHaveLength(2);
		expect(body.data.results[0].status).toBe('ok');
		expect(body.data.results[1].status).toBe('ok');
	});

	it('dry run executes ops but nothing persists', async () => {
		const { status, body } = await txRequest(
			[
				{
					id: 'create_col',
					service: 'CollectionsService',
					action: 'createOne',
					body: {
						collection: TEST_COLLECTION,
						meta: {},
						schema: {},
						fields: [
							{ field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } },
						],
					},
				},
			],
			{ dry_run: true },
		);

		expect(status).toBe(200);
		expect(body.data.status).toBe('ok');
		expect(body.data.dry_run).toBe(true);
		expect(body.data.results).toHaveLength(1);
		expect(body.data.results[0].status).toBe('ok');

		// Collection should NOT exist
		expect(await collectionExists(TEST_COLLECTION)).toBe(false);
	});
});
