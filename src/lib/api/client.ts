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

export async function get<T>(path: string): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`);
	if (!res.ok) {
		throw new Error(`API error: ${res.status} ${res.statusText}`);
	}
	const data = await res.json();

	if (Array.isArray(data)) {
		return data.map((item) => parsePythonLists(item)) as T;
	}
	return parsePythonLists(data) as T;
}
