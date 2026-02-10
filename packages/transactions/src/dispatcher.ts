import type { ServiceOperation } from './types.js';
import { BLOCKED_SERVICES, COLLECTION_SERVICES } from './services.js';

interface DispatchContext {
	knex: any;
	accountability: any;
	schema: any;
}

const DANGEROUS_NAMES = new Set(['__proto__', 'constructor', 'prototype']);

export async function dispatch(
	op: ServiceOperation,
	services: Record<string, any>,
	ctx: DispatchContext,
): Promise<unknown> {
	const { service: serviceName, action, collection, id_param, body, query, args } = op;

	// Validate service
	if (BLOCKED_SERVICES.has(serviceName)) {
		throw new Error(`Service "${serviceName}" is blocked`);
	}

	const ServiceClass = services[serviceName];

	if (!ServiceClass) {
		throw new Error(`Service "${serviceName}" not found`);
	}

	// Validate action name
	if (DANGEROUS_NAMES.has(action) || action.startsWith('_')) {
		throw new Error(`Action "${action}" is not allowed`);
	}

	// Instantiate service
	const serviceOpts = {
		knex: ctx.knex,
		accountability: ctx.accountability,
		schema: ctx.schema,
	};

	const instance = COLLECTION_SERVICES.has(serviceName)
		? new ServiceClass(collection, serviceOpts)
		: new ServiceClass(serviceOpts);

	// Validate action exists on instance
	if (typeof instance[action] !== 'function') {
		throw new TypeError(`Action "${action}" not found on "${serviceName}"`);
	}

	// Build args based on known method signatures
	const callArgs = buildArgs(serviceName, action, { collection, id_param, body, query, args });

	return instance[action](...callArgs);
}

function buildArgs(
	serviceName: string,
	action: string,
	params: {
		collection?: string;
		id_param?: string | number;
		body?: unknown;
		query?: Record<string, unknown>;
		args?: unknown[];
	},
): unknown[] {
	// FieldsService special methods
	if (serviceName === 'FieldsService') {
		switch (action) {
			case 'createField':
				return [params.collection, params.body];
			case 'updateField':
				return [params.collection, params.id_param, params.body];
			case 'deleteField':
				return [params.collection, params.id_param];
		}
	}

	// RelationsService special methods
	if (serviceName === 'RelationsService') {
		switch (action) {
			case 'updateOne':
				return [params.collection, params.id_param, params.body];
			case 'deleteOne':
				return [params.collection, params.id_param];
		}
	}

	// Standard CRUD methods
	switch (action) {
		case 'createOne':
			return [params.body];
		case 'createMany':
			return [params.body];
		case 'updateOne':
			return [params.id_param, params.body];
		case 'updateMany':
			return [params.body, params.query];
		case 'deleteOne':
			return [params.id_param];
		case 'deleteMany':
			return [params.query];
		case 'readOne':
			return [params.id_param, params.query];
		case 'readByQuery':
			return [params.query];
		case 'upsertSingleton':
			return [params.body];
	}

	// Fallback to args array
	if (params.args) {
		return params.args;
	}

	// Last resort: body only
	if (params.body !== undefined) {
		return [params.body];
	}

	return [];
}
