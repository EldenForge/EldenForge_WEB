import { post, get, put, del } from './client';

export interface BuildListItem {
	id: string;
	name: string;
	description: string | null;
	is_public: boolean;
	created_at: string;
	updated_at: string;
}

export interface BuildOut extends BuildListItem {
	user_id: string;
	data: Record<string, unknown>;
}

export interface BuildCreateInput {
	name: string;
	description?: string;
	data: Record<string, unknown>;
	is_public?: boolean;
}

export interface BuildUpdateInput {
	name?: string;
	description?: string | null;
	data?: Record<string, unknown>;
	is_public?: boolean;
}

export async function createBuild(input: BuildCreateInput): Promise<BuildOut> {
	return post<BuildOut>('/builds', input);
}

export async function listMyBuilds(limit = 50, offset = 0): Promise<BuildListItem[]> {
	return get<BuildListItem[]>(`/builds?limit=${limit}&offset=${offset}`);
}

export async function getBuild(id: string): Promise<BuildOut> {
	return get<BuildOut>(`/builds/${id}`);
}

export async function updateBuild(id: string, input: BuildUpdateInput): Promise<BuildOut> {
	return put<BuildOut>(`/builds/${id}`, input);
}

export async function deleteBuild(id: string): Promise<void> {
	await del<void>(`/builds/${id}`);
}
