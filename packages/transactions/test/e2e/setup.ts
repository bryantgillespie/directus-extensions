import process from 'node:process';

const DIRECTUS_URL = process.env['DIRECTUS_URL'] || 'http://localhost:8055';
const ADMIN_EMAIL = process.env['ADMIN_EMAIL'] || 'admin@directus.dev';
const ADMIN_PASSWORD = process.env['ADMIN_PASSWORD'] || 'password';

let adminToken: string | null = null;

export async function getAdminToken(): Promise<string> {
	if (adminToken) return adminToken;

	const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
	});

	if (!res.ok) throw new Error(`Failed to login: ${res.status} ${await res.text()}`);

	const data = (await res.json()) as any;
	adminToken = data.data.access_token;
	return adminToken!;
}

export async function txRequest(operations: any[], options?: { dry_run?: boolean }): Promise<any> {
	const token = await getAdminToken();

	const res = await fetch(`${DIRECTUS_URL}/transactions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`,
		},
		body: JSON.stringify({
			operations,
			dry_run: options?.dry_run,
		}),
	});

	return { status: res.status, body: await res.json() };
}

export async function txRequestUnauthenticated(operations: any[]): Promise<any> {
	const res = await fetch(`${DIRECTUS_URL}/transactions`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ operations }),
	});

	return { status: res.status, body: await res.json() };
}

export async function directusRequest(method: string, path: string, body?: any): Promise<any> {
	const token = await getAdminToken();

	const res = await fetch(`${DIRECTUS_URL}${path}`, {
		method,
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`,
		},
		body: body ? JSON.stringify(body) : undefined,
	});

	return { status: res.status, body: res.ok ? await res.json() : null };
}

export async function collectionExists(collection: string): Promise<boolean> {
	const res = await directusRequest('GET', `/collections/${collection}`);
	return res.status === 200;
}

export async function cleanupCollection(collection: string): Promise<void> {
	try {
		await directusRequest('DELETE', `/collections/${collection}`);
	}
	catch {
		// ignore
	}
}
