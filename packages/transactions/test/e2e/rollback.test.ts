import { afterEach, describe, expect, it } from 'vitest';
import { cleanupCollection, collectionExists, txRequest, txRequestUnauthenticated } from './setup.js';

const TEST_COLLECTION = 'test_tx_rollback';

afterEach(async () => {
	await cleanupCollection(TEST_COLLECTION);
});

describe('rollback e2e', () => {
	it('rolls back all ops when one fails', async () => {
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
				id: 'bad_op',
				service: 'FieldsService',
				action: 'createField',
				collection: 'nonexistent_collection_xyz',
				body: { field: 'title', type: 'string', schema: {} },
			},
			{
				id: 'never_runs',
				service: 'FieldsService',
				action: 'createField',
				collection: TEST_COLLECTION,
				body: { field: 'body', type: 'text', schema: {} },
			},
		]);

		expect(status).toBe(500);
		expect(body.errors).toHaveLength(1);
		expect(body.errors[0].extensions.code).toBe('TRANSACTION_FAILED');

		const results = body.errors[0].extensions.results;
		expect(results).toHaveLength(3);
		expect(results[0].status).toBe('ok');
		expect(results[1].status).toBe('error');
		expect(results[2].status).toBe('not_executed');

		// Collection should NOT exist (rolled back)
		expect(await collectionExists(TEST_COLLECTION)).toBe(false);
	});

	it('rejects blocked services with 400', async () => {
		const { status, body } = await txRequest([
			{
				service: 'AuthenticationService',
				action: 'login',
				body: { email: 'admin@directus.dev', password: 'password' },
			},
		]);

		expect(status).toBe(400);
		expect(body.errors[0].extensions.code).toBe('INVALID_PAYLOAD');
	});

	it('rejects unauthenticated requests with 401', async () => {
		const { status, body } = await txRequestUnauthenticated([
			{
				service: 'CollectionsService',
				action: 'readByQuery',
				query: {},
			},
		]);

		expect(status).toBe(401);
		expect(body.errors[0].extensions.code).toBe('UNAUTHORIZED');
	});

	it('returns correct response format on failure', async () => {
		const { body } = await txRequest([
			{
				id: 'step1',
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
				id: 'step2_fail',
				service: 'ItemsService',
				action: 'readOne',
				collection: 'nonexistent_collection_xyz',
				id_param: '999',
			},
		]);

		const results = body.errors[0].extensions.results;

		// step1 succeeded before failure
		expect(results[0].id).toBe('step1');
		expect(results[0].index).toBe(0);
		expect(results[0].status).toBe('ok');

		// step2 failed
		expect(results[1].id).toBe('step2_fail');
		expect(results[1].index).toBe(1);
		expect(results[1].status).toBe('error');
		expect(results[1].error).toBeDefined();
		expect(results[1].error.message).toBeDefined();
	});
});
