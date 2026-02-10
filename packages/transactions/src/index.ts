import type { Operation, ServiceOperation, TransactionRequest } from './types.js';
import { defineEndpoint } from '@directus/extensions-sdk';
import { execute } from './executor.js';
import { BLOCKED_SERVICES, COLLECTION_SERVICES } from './services.js';
import { isHttpOperation, isServiceOperation } from './types.js';

const DANGEROUS_NAMES = new Set(['__proto__', 'constructor', 'prototype']);

export default defineEndpoint({
	id: 'transactions',
	handler: (router, context) => {
		const { services, database, getSchema, env } = context;

		// Concurrency limiter
		const maxConcurrent = Number(env['TRANSACTIONS_MAX_CONCURRENT']) || 3;
		let activeTx = 0;

		router.post('/', async (req: any, res: any) => {
		// Auth guard
			if (!req.accountability?.user) {
				return res.status(401).json({
					errors: [{ message: 'Unauthenticated', extensions: { code: 'UNAUTHORIZED' } }],
				});
			}

			// Concurrency guard
			if (activeTx >= maxConcurrent) {
				return res.status(503).json({
					errors: [{ message: 'Too many concurrent transactions', extensions: { code: 'SERVICE_UNAVAILABLE' } }],
				});
			}

			const body = req.body as TransactionRequest;

			// Validate payload
			if (!body?.operations || !Array.isArray(body.operations) || body.operations.length === 0) {
				return res.status(400).json({
					errors: [{ message: 'Request must include a non-empty operations array', extensions: { code: 'INVALID_PAYLOAD' } }],
				});
			}

			// Validate operations
			const validationError = validateOperations(body.operations);

			if (validationError) {
				return res.status(400).json({
					errors: [{ message: validationError, extensions: { code: 'INVALID_PAYLOAD' } }],
				});
			}

			activeTx++;

			try {
				const result = await execute(body.operations, body.dry_run === true, {
					services,
					database,
					getSchema,
					accountability: req.accountability,
					env,
				});

				if (result.status === 'ok') {
					const data: Record<string, unknown> = {
						status: 'ok',
						results: result.results,
					};

					if (result.dry_run) {
						data['dry_run'] = true;
					}

					return res.json({ data });
				}

				// Transaction failed
				const httpStatus = result.error!.code === 'INVALID_PAYLOAD' ? 400 : 500;

				return res.status(httpStatus).json({
					errors: [{
						message: result.error!.message,
						extensions: {
							code: result.error!.code,
							results: result.results,
						},
					}],
				});
			}
			catch (error: any) {
				return res.status(500).json({
					errors: [{
						message: error.message ?? 'Internal server error',
						extensions: { code: 'INTERNAL_SERVER_ERROR' },
					}],
				});
			}
			finally {
				activeTx--;
			}
		});
	},
});

function validateOperations(operations: Operation[]): string | null {
	const ids = new Set<string>();

	for (const [i, operation] of operations.entries()) {
		const op = operation!;

		// Check for valid operation format
		if (!isHttpOperation(op) && !isServiceOperation(op)) {
			return `Operation at index ${i} must have either (service + action) or (method + path)`;
		}

		// Reject ambiguous ops that have both formats
		if (isHttpOperation(op) && isServiceOperation(op)) {
			return `Operation at index ${i} has both (service + action) and (method + path) — use one format`;
		}

		// Validate ID uniqueness
		if (op.id) {
			if (DANGEROUS_NAMES.has(op.id)) {
				return `Operation ID "${op.id}" is not allowed`;
			}

			if (ids.has(op.id)) {
				return `Duplicate operation ID "${op.id}"`;
			}

			ids.add(op.id);
		}

		// Validate service-based ops
		if (isServiceOperation(op)) {
			const svcOp = op as ServiceOperation;

			if (BLOCKED_SERVICES.has(svcOp.service)) {
				return `Service "${svcOp.service}" is not allowed`;
			}

			if (DANGEROUS_NAMES.has(svcOp.action) || svcOp.action.startsWith('_')) {
				return `Action "${svcOp.action}" is not allowed`;
			}

			if (COLLECTION_SERVICES.has(svcOp.service) && !svcOp.collection) {
				return `Operation at index ${i}: "${svcOp.service}" requires a "collection" field`;
			}
		}
	}

	return null;
}
