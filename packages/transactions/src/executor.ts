import type { Operation, OperationResult, ServiceOperation } from './types.js';
import { dispatch } from './dispatcher.js';
import { normalizeHttpOperation } from './http-mapping.js';
import { resolveReferences } from './resolver.js';
import { SCHEMA_MUTATING_SERVICES } from './services.js';
import { isHttpOperation } from './types.js';

class DryRunComplete extends Error {
	constructor(public results: OperationResult[]) {
		super('Dry run complete');
	}
}

interface ExecutorContext {
	services: Record<string, any>;
	database: any;
	getSchema: (options?: { database?: any; bypassCache?: boolean }) => Promise<any>;
	accountability: any;
	env: Record<string, any>;
}

interface ExecutorResult {
	status: 'ok' | 'error';
	dry_run?: boolean;
	results: OperationResult[];
	error?: { message: string; code: string };
	failedIndex?: number;
}

export async function execute(
	operations: Operation[],
	dryRun: boolean,
	ctx: ExecutorContext,
): Promise<ExecutorResult> {
	const maxOps = Number(ctx.env['TRANSACTIONS_MAX_OPS']) || 50;
	const timeoutMs = Number(ctx.env['TRANSACTIONS_TIMEOUT_MS']) || 30_000;

	if (operations.length > maxOps) {
		return {
			status: 'error',
			results: [],
			error: {
				message: `Too many operations: ${operations.length} exceeds limit of ${maxOps}`,
				code: 'INVALID_PAYLOAD',
			},
		};
	}

	const results: OperationResult[] = [];
	const scope: Record<string, unknown> = {};

	try {
		await ctx.database.transaction(async (trx: any) => {
			let schema = await ctx.getSchema({ database: trx, bypassCache: true });
			let timedOut = false;

			const timeout = setTimeout(() => {
				timedOut = true;
				trx.rollback(new Error(`Transaction timed out after ${timeoutMs}ms`));
			}, timeoutMs);

			try {
				for (let i = 0; i < operations.length; i++) {
					if (timedOut) {
						throw new Error(`Transaction timed out after ${timeoutMs}ms`);
					}

					const op = operations[i]!;

					// Normalize HTTP-like ops to service-based
					let serviceOp: ServiceOperation;

					if (isHttpOperation(op)) {
						const normalized = normalizeHttpOperation(op);
						serviceOp = { ...normalized, id: op.id };
					}
					else {
						serviceOp = op as ServiceOperation;
					}

					// Resolve {{ }} references
					const resolved = resolveReferences(serviceOp, scope) as ServiceOperation;

					try {
						const result = await dispatch(resolved, ctx.services, {
							knex: trx,
							accountability: ctx.accountability,
							schema,
						});

						const opResult: OperationResult = {
							id: resolved.id,
							index: i,
							status: 'ok',
							result: result ?? null,
						};

						results.push(opResult);

						// Update scope
						if (resolved.id) {
							scope[resolved.id] = result ?? null;
						}

						scope['$last'] = result ?? null;

						// Refresh schema if this was a schema-mutating service
						if (SCHEMA_MUTATING_SERVICES.has(resolved.service) // Only refresh if there are more ops that might need the new schema
							&& i < operations.length - 1) {
							schema = await ctx.getSchema({ database: trx, bypassCache: true });
						}
					}
					catch (error: any) {
						// Operation failed — record error and remaining as not_executed
						results.push({
							id: resolved.id,
							index: i,
							status: 'error',
							error: {
								message: error.message ?? String(error),
								code: error.code,
							},
						});

						// Mark remaining ops as not_executed
						for (let j = i + 1; j < operations.length; j++) {
							const remaining = operations[j]!;
							let svcName: string;
							let actName: string;

							if (isHttpOperation(remaining)) {
								try {
									const norm = normalizeHttpOperation(remaining);
									svcName = norm.service;
									actName = norm.action;
								}
								catch {
									svcName = 'unknown';
									actName = 'unknown';
								}
							}
							else {
								svcName = (remaining as ServiceOperation).service;
								actName = (remaining as ServiceOperation).action;
							}

							results.push({
								id: remaining.id,
								index: j,
								status: 'not_executed',
								service: svcName,
								action: actName,
							});
						}

						// Throw to trigger rollback
						const rollbackErr = new Error(`Transaction failed at operation index ${i}`);
						(rollbackErr as any).transactionResults = results;
						(rollbackErr as any).failedIndex = i;
						throw rollbackErr;
					}
				}

				// All ops succeeded
				if (dryRun) {
					throw new DryRunComplete(results);
				}
			}
			finally {
				clearTimeout(timeout);
			}
		});

		// Transaction committed successfully
		return { status: 'ok', results };
	}
	catch (error: any) {
		if (error instanceof DryRunComplete) {
			return { status: 'ok', dry_run: true, results: error.results };
		}

		if (error.transactionResults) {
			return {
				status: 'error',
				results: error.transactionResults,
				error: { message: error.message, code: 'TRANSACTION_FAILED' },
				failedIndex: error.failedIndex,
			};
		}

		// Unexpected error
		throw error;
	}
}
