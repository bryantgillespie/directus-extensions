export interface ServiceOperation {
	id?: string;
	service: string;
	action: string;
	collection?: string;
	id_param?: string | number;
	body?: unknown;
	query?: Record<string, unknown>;
	args?: unknown[];
}

export interface HttpOperation {
	id?: string;
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	path: string;
	body?: unknown;
	query?: Record<string, unknown>;
}

export type Operation = ServiceOperation | HttpOperation;

export interface TransactionRequest {
	operations: Operation[];
	dry_run?: boolean;
}

export interface OperationResultOk {
	id: string | undefined;
	index: number;
	status: 'ok';
	result: unknown;
}

export interface OperationResultError {
	id: string | undefined;
	index: number;
	status: 'error';
	error: { message: string; code?: string };
}

export interface OperationResultNotExecuted {
	id: string | undefined;
	index: number;
	status: 'not_executed';
	service: string;
	action: string;
}

export type OperationResult = OperationResultOk | OperationResultError | OperationResultNotExecuted;

export function isHttpOperation(op: Operation): op is HttpOperation {
	return 'method' in op && 'path' in op;
}

export function isServiceOperation(op: Operation): op is ServiceOperation {
	return 'service' in op && 'action' in op;
}
