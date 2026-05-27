const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function parsePythonLists(obj: Record<string, unknown>): Record<string, unknown> {
	const parsed = { ...obj };
	for (const key of Object.keys(parsed)) {
		const val = parsed[key];
		if (typeof val === 'string' && val.startsWith('[')) {
			try {
				parsed[key] = JSON.parse(val.replace(/'/g, '"'));
			} catch {
				// keep as string
			}
		}
	}
	return parsed;
}

export class ApiError extends Error {
	constructor(public status: number, public detail: string) {
		super(detail);
	}
}

/** Paths for which we must NOT attempt silent refresh (would create infinite loops). */
function isAuthFlowPath(path: string): boolean {
	return (
		path.startsWith('/auth/login') ||
		path.startsWith('/auth/register') ||
		path.startsWith('/auth/refresh') ||
		path.startsWith('/auth/logout') ||
		path.startsWith('/auth/verify') ||
		path.startsWith('/auth/forgot') ||
		path.startsWith('/auth/reset')
	);
}

/** Promise that resolves to true if refresh succeeded, false otherwise. Coalesced. */
let pendingRefresh: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
	if (pendingRefresh) return pendingRefresh;
	pendingRefresh = (async () => {
		try {
			const res = await fetch(`${BASE_URL}/auth/refresh`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
			return res.ok;
		} catch {
			return false;
		} finally {
			// Reset pending so the next 401 can trigger a fresh refresh attempt later
			setTimeout(() => {
				pendingRefresh = null;
			}, 0);
		}
	})();
	return pendingRefresh;
}

async function rawFetch(method: string, path: string, body?: unknown): Promise<Response> {
	const init: RequestInit = {
		method,
		credentials: 'include',
		headers: body !== undefined ? { 'Content-Type': 'application/json' } : {}
	};
	if (body !== undefined) {
		init.body = JSON.stringify(body);
	}
	return fetch(`${BASE_URL}${path}`, init);
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
	let res = await rawFetch(method, path, body);

	// Silent refresh: if 401 and the request is NOT itself an auth-flow call, try once to refresh
	if (res.status === 401 && !isAuthFlowPath(path)) {
		const refreshed = await attemptRefresh();
		if (refreshed) {
			res = await rawFetch(method, path, body);
		}
	}

	if (res.status === 204) {
		return undefined as T;
	}
	const data = await res.json().catch(() => null);
	if (!res.ok) {
		const detail =
			data && typeof data === 'object' && 'detail' in data
				? String((data as { detail: unknown }).detail)
				: res.statusText;
		throw new ApiError(res.status, detail);
	}
	if (Array.isArray(data)) {
		return data.map((item) => parsePythonLists(item)) as T;
	}
	if (data && typeof data === 'object') {
		return parsePythonLists(data) as T;
	}
	return data as T;
}

export async function get<T>(path: string): Promise<T> {
	return request<T>('GET', path);
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
	return request<T>('POST', path, body ?? {});
}

export async function patch<T>(path: string, body: unknown): Promise<T> {
	return request<T>('PATCH', path, body);
}

export async function put<T>(path: string, body: unknown): Promise<T> {
	return request<T>('PUT', path, body);
}

export async function del<T>(path: string): Promise<T> {
	return request<T>('DELETE', path);
}
