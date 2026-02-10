import type { HttpOperation, ServiceOperation } from './types.js';

/** Map resource name to service class name */
const RESOURCE_SERVICE_MAP: Record<string, string> = {
	collections: 'CollectionsService',
	fields: 'FieldsService',
	relations: 'RelationsService',
	users: 'UsersService',
	roles: 'RolesService',
	policies: 'PoliciesService',
	permissions: 'PermissionsService',
	access: 'AccessService',
	files: 'FilesService',
	folders: 'FoldersService',
	presets: 'PresetsService',
	revisions: 'RevisionsService',
	activity: 'ActivityService',
	settings: 'SettingsService',
	webhooks: 'WebhooksService',
	flows: 'FlowsService',
	operations: 'OperationsService',
	dashboards: 'DashboardsService',
	panels: 'PanelsService',
	translations: 'TranslationsService',
	notifications: 'NotificationsService',
	shares: 'SharesService',
	comments: 'CommentsService',
	versions: 'VersionsService',
};

/** Resources that take (collection, field) path segments */
const COLLECTION_FIELD_RESOURCES = new Set(['fields', 'relations']);

const METHOD_ACTION_MAP: Record<string, { list: string; one: string }> = {
	GET: { list: 'readByQuery', one: 'readOne' },
	POST: { list: 'createOne', one: 'createOne' },
	PATCH: { list: 'updateMany', one: 'updateOne' },
	DELETE: { list: 'deleteMany', one: 'deleteOne' },
};

export function normalizeHttpOperation(op: HttpOperation): Omit<ServiceOperation, 'id'> {
	const { method, path, body, query } = op;
	const segments = path.replace(/^\//, '').split('/').filter(Boolean);
	const resource = segments[0];

	if (!resource) {
		throw new Error(`Route "${method} ${path}" is not mapped. Use service-based format.`);
	}

	// Special case: /items/:collection[/:id]
	if (resource === 'items') {
		const collection = segments[1];

		if (!collection) {
			throw new Error(`Route "${method} ${path}" is not mapped. Use service-based format.`);
		}

		const id = segments[2];
		return buildItemsOp(method, collection, id, body, query);
	}

	// Special case: /settings (singleton)
	if (resource === 'settings' && method === 'PATCH' && segments.length === 1) {
		return { service: 'SettingsService', action: 'upsertSingleton', body };
	}

	// Special case: /fields/:collection[/:field] and /relations/:collection/:field
	if (COLLECTION_FIELD_RESOURCES.has(resource) && segments.length >= 2) {
		return buildCollectionFieldOp(resource, method, segments, body, query);
	}

	const serviceName = RESOURCE_SERVICE_MAP[resource];

	if (!serviceName) {
		throw new Error(`Route "${method} ${path}" is not mapped. Use service-based format.`);
	}

	// Generic CRUD: /{resource}[/:id]
	const id = segments[1];
	const actions = METHOD_ACTION_MAP[method];

	if (!actions) {
		throw new Error(`Route "${method} ${path}" is not mapped. Use service-based format.`);
	}

	const result: Omit<ServiceOperation, 'id'> = {
		service: serviceName,
		action: id ? actions.one : actions.list,
	};

	if (id) result.id_param = id;
	if (body !== undefined) result.body = body;
	if (query !== undefined) result.query = query;

	return result;
}

function buildItemsOp(
	method: string,
	collection: string,
	id: string | undefined,
	body: unknown,
	query: Record<string, unknown> | undefined,
): Omit<ServiceOperation, 'id'> {
	const actions = METHOD_ACTION_MAP[method];

	if (!actions) {
		throw new Error(`Method "${method}" is not mapped for items. Use service-based format.`);
	}

	const result: Omit<ServiceOperation, 'id'> = {
		service: 'ItemsService',
		action: id ? actions.one : actions.list,
		collection,
	};

	if (id) result.id_param = id;
	if (body !== undefined) result.body = body;
	if (query !== undefined) result.query = query;

	return result;
}

function buildCollectionFieldOp(
	resource: string,
	method: string,
	segments: string[],
	body: unknown,
	query: Record<string, unknown> | undefined,
): Omit<ServiceOperation, 'id'> {
	const serviceName = RESOURCE_SERVICE_MAP[resource]!;
	const collection = segments[1]!;
	const field = segments[2];

	// Fields special actions
	if (resource === 'fields') {
		if (method === 'POST' && !field) {
			return { service: serviceName, action: 'createField', collection, body };
		}

		if (method === 'PATCH' && field) {
			return { service: serviceName, action: 'updateField', collection, id_param: field, body };
		}

		if (method === 'DELETE' && field) {
			return { service: serviceName, action: 'deleteField', collection, id_param: field };
		}
	}

	// Relations special actions
	if (resource === 'relations' && field) {
		if (method === 'PATCH') {
			return { service: serviceName, action: 'updateOne', collection, id_param: field, body };
		}

		if (method === 'DELETE') {
			return { service: serviceName, action: 'deleteOne', collection, id_param: field };
		}
	}

	// Relations POST (no field segment)
	if (resource === 'relations' && method === 'POST' && !field) {
		return { service: serviceName, action: 'createOne', body };
	}

	// Fallback to generic
	const actions = METHOD_ACTION_MAP[method];

	if (!actions) {
		throw new Error(`Route "${method} /${segments.join('/')}" is not mapped. Use service-based format.`);
	}

	const result: Omit<ServiceOperation, 'id'> = {
		service: serviceName,
		action: field ? actions.one : actions.list,
		collection,
	};

	if (field) result.id_param = field;
	if (body !== undefined) result.body = body;
	if (query !== undefined) result.query = query;

	return result;
}
