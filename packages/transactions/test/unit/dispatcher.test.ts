import type { ServiceOperation } from '../../src/types.js';
import { describe, expect, it, vi } from 'vitest';
import { dispatch } from '../../src/dispatcher.js';

function makeMockServices() {
	const mockInstance = {
		createOne: vi.fn().mockResolvedValue('new-id'),
		createMany: vi.fn().mockResolvedValue(['id1', 'id2']),
		updateOne: vi.fn().mockResolvedValue('pk'),
		updateMany: vi.fn().mockResolvedValue(['pk1']),
		deleteOne: vi.fn().mockResolvedValue('pk'),
		deleteMany: vi.fn().mockResolvedValue(['pk1']),
		readOne: vi.fn().mockResolvedValue({ id: 1 }),
		readByQuery: vi.fn().mockResolvedValue([{ id: 1 }]),
	};

	const MockService = vi.fn().mockReturnValue(mockInstance);

	const mockFieldsInstance = {
		createField: vi.fn().mockResolvedValue(),
		updateField: vi.fn().mockResolvedValue(),
		deleteField: vi.fn().mockResolvedValue(),
	};

	const MockFieldsService = vi.fn().mockReturnValue(mockFieldsInstance);

	const mockRelationsInstance = {
		createOne: vi.fn().mockResolvedValue(),
		updateOne: vi.fn().mockResolvedValue(),
		deleteOne: vi.fn().mockResolvedValue(),
	};

	const MockRelationsService = vi.fn().mockReturnValue(mockRelationsInstance);

	const mockItemsInstance = {
		createOne: vi.fn().mockResolvedValue('item-id'),
		readOne: vi.fn().mockResolvedValue({ id: 1 }),
	};

	const MockItemsService = vi.fn().mockReturnValue(mockItemsInstance);

	const mockSettingsInstance = {
		upsertSingleton: vi.fn().mockResolvedValue(),
	};

	const MockSettingsService = vi.fn().mockReturnValue(mockSettingsInstance);

	return {
		services: {
			CollectionsService: MockService,
			FieldsService: MockFieldsService,
			RelationsService: MockRelationsService,
			ItemsService: MockItemsService,
			SettingsService: MockSettingsService,
			AuthenticationService: vi.fn(),
			MailService: vi.fn(),
		} as Record<string, any>,
		mocks: {
			collections: mockInstance,
			fields: mockFieldsInstance,
			relations: mockRelationsInstance,
			items: mockItemsInstance,
			settings: mockSettingsInstance,
		},
		MockService,
		MockItemsService,
	};
}

const baseContext = {
	knex: {} as any,
	accountability: { user: 'test-user', role: 'admin' } as any,
	schema: {} as any,
};

describe('dispatch', () => {
	it('calls createOne with body', async () => {
		const { services, mocks } = makeMockServices();
		const op: ServiceOperation = {
			service: 'CollectionsService',
			action: 'createOne',
			body: { collection: 'articles' },
		};

		const result = await dispatch(op, services, baseContext);
		expect(mocks.collections.createOne).toHaveBeenCalledWith({ collection: 'articles' });
		expect(result).toBe('new-id');
	});

	it('calls updateOne with id_param and body', async () => {
		const { services, mocks } = makeMockServices();
		const op: ServiceOperation = {
			service: 'CollectionsService',
			action: 'updateOne',
			id_param: 'pk-123',
			body: { name: 'updated' },
		};

		await dispatch(op, services, baseContext);
		expect(mocks.collections.updateOne).toHaveBeenCalledWith('pk-123', { name: 'updated' });
	});

	it('calls deleteOne with id_param', async () => {
		const { services, mocks } = makeMockServices();
		const op: ServiceOperation = {
			service: 'CollectionsService',
			action: 'deleteOne',
			id_param: 'pk-123',
		};

		await dispatch(op, services, baseContext);
		expect(mocks.collections.deleteOne).toHaveBeenCalledWith('pk-123');
	});

	it('calls readOne with id_param and query', async () => {
		const { services, mocks } = makeMockServices();
		const op: ServiceOperation = {
			service: 'CollectionsService',
			action: 'readOne',
			id_param: 'pk-123',
			query: { fields: ['*'] },
		};

		await dispatch(op, services, baseContext);
		expect(mocks.collections.readOne).toHaveBeenCalledWith('pk-123', { fields: ['*'] });
	});

	it('calls readByQuery with query', async () => {
		const { services, mocks } = makeMockServices();
		const op: ServiceOperation = {
			service: 'CollectionsService',
			action: 'readByQuery',
			query: { limit: 10 },
		};

		await dispatch(op, services, baseContext);
		expect(mocks.collections.readByQuery).toHaveBeenCalledWith({ limit: 10 });
	});

	it('uses collection param for ItemsService constructor', async () => {
		const { services, MockItemsService } = makeMockServices();
		const op: ServiceOperation = {
			service: 'ItemsService',
			action: 'createOne',
			collection: 'articles',
			body: { title: 'Hello' },
		};

		await dispatch(op, services, baseContext);

		expect(MockItemsService).toHaveBeenCalledWith('articles', expect.objectContaining({
			knex: baseContext.knex,
		}));
	});

	it('passes emitEvents: false and autoPurgeSystemCache: false to FieldsService', async () => {
		const { services, mocks } = makeMockServices();
		const op: ServiceOperation = {
			service: 'FieldsService',
			action: 'createField',
			collection: 'articles',
			body: { field: 'title', type: 'string' },
		};

		await dispatch(op, services, baseContext);
		expect(mocks.fields.createField).toHaveBeenCalledWith('articles', { field: 'title', type: 'string' });
	});

	it('calls RelationsService.deleteOne with collection and field', async () => {
		const { services, mocks } = makeMockServices();
		const op: ServiceOperation = {
			service: 'RelationsService',
			action: 'deleteOne',
			collection: 'articles',
			id_param: 'author',
		};

		await dispatch(op, services, baseContext);
		expect(mocks.relations.deleteOne).toHaveBeenCalledWith('articles', 'author');
	});

	it('rejects blocked services', async () => {
		const { services } = makeMockServices();
		const op: ServiceOperation = {
			service: 'AuthenticationService',
			action: 'login',
			body: {},
		};

		await expect(dispatch(op, services, baseContext)).rejects.toThrow('blocked');
	});

	it('rejects unknown services', async () => {
		const { services } = makeMockServices();
		const op: ServiceOperation = {
			service: 'NonExistentService',
			action: 'doSomething',
		};

		await expect(dispatch(op, services, baseContext)).rejects.toThrow('not found');
	});

	it('rejects dangerous action names', async () => {
		const { services } = makeMockServices();

		for (const action of ['__proto__', 'constructor', 'prototype', '_private']) {
			const op: ServiceOperation = {
				service: 'CollectionsService',
				action,
			};

			await expect(dispatch(op, services, baseContext)).rejects.toThrow('not allowed');
		}
	});

	it('rejects action not found on service instance', async () => {
		const { services } = makeMockServices();
		const op: ServiceOperation = {
			service: 'CollectionsService',
			action: 'nonExistentMethod',
		};

		await expect(dispatch(op, services, baseContext)).rejects.toThrow('not found');
	});

	it('uses args array for non-standard methods', async () => {
		const { services } = makeMockServices();
		// Add a custom method to the mock
		const customFn = vi.fn().mockResolvedValue('custom-result');

		(services['CollectionsService'] as any).mockReturnValue({
			createOne: vi.fn(),
			customMethod: customFn,
		});

		const op: ServiceOperation = {
			service: 'CollectionsService',
			action: 'customMethod',
			args: ['arg1', 'arg2'],
		};

		const result = await dispatch(op, services, baseContext);
		expect(customFn).toHaveBeenCalledWith('arg1', 'arg2');
		expect(result).toBe('custom-result');
	});

	it('calls SettingsService.upsertSingleton with body', async () => {
		const { services, mocks } = makeMockServices();
		const op: ServiceOperation = {
			service: 'SettingsService',
			action: 'upsertSingleton',
			body: { project_name: 'Test' },
		};

		await dispatch(op, services, baseContext);
		expect(mocks.settings.upsertSingleton).toHaveBeenCalledWith({ project_name: 'Test' });
	});
});
