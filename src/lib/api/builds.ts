import { post, get, put, del } from './client';

export type BuildIntent = 'pve' | 'coop' | 'pvp';

export interface BuildListItem {
	id: string;
	name: string;
	description: string | null;
	is_public: boolean;
	created_at: string;
	updated_at: string;
	intent: BuildIntent;
}

export interface BuildOut extends BuildListItem {
	user_id: string;
	data: Record<string, unknown>;
	tags: string[];
	forked_from_id: string | null;
}

export interface BuildCreateInput {
	name: string;
	description?: string;
	data: Record<string, unknown>;
	is_public?: boolean;
	tags?: string[];
	intent?: BuildIntent;
}

export interface BuildUpdateInput {
	name?: string;
	description?: string | null;
	data?: Record<string, unknown>;
	is_public?: boolean;
	tags?: string[];
	intent?: BuildIntent;
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

export interface PublicBuildListItem {
	id: string;
	name: string;
	description: string | null;
	tags: string[];
	like_count: number;
	created_at: string;
	author_pseudo: string;
	liked_by_me: boolean;
	intent: BuildIntent;
	primary_weapon_image?: string | null;
	has_dlc: boolean;
}

export interface ForkedFromInfo {
	id: string;
	name: string;
	author_pseudo: string;
}

export interface PublicBuildOut {
	id: string;
	name: string;
	description: string | null;
	data: Record<string, unknown>;
	tags: string[];
	like_count: number;
	created_at: string;
	updated_at: string;
	author_pseudo: string;
	liked_by_me: boolean;
	is_mine: boolean;
	intent: BuildIntent;
	forked_from: ForkedFromInfo | null;
	has_dlc: boolean;
}

export interface LikeStatus {
	liked: boolean;
	like_count: number;
}

export interface ListPublicParams {
	search?: string;
	tags?: string[];
	sort?: 'recent' | 'popular' | 'trending';
	item?: string;
	author?: string;
	limit?: number;
	offset?: number;
}

export async function listPublicBuilds(params: ListPublicParams = {}): Promise<PublicBuildListItem[]> {
	const q = new URLSearchParams();
	if (params.search) q.set('search', params.search);
	if (params.tags && params.tags.length) q.set('tags', params.tags.join(','));
	if (params.sort) q.set('sort', params.sort);
	if (params.item) q.set('item', params.item);
	if (params.author) q.set('author', params.author);
	q.set('limit', String(params.limit ?? 20));
	q.set('offset', String(params.offset ?? 0));
	return get<PublicBuildListItem[]>(`/public/builds?${q.toString()}`);
}

export async function getPublicBuild(id: string): Promise<PublicBuildOut> {
	return get<PublicBuildOut>(`/public/builds/${id}`);
}

export async function forkBuild(id: string): Promise<BuildOut> {
	return post<BuildOut>(`/builds/${id}/fork`);
}

export async function likeBuild(id: string): Promise<LikeStatus> {
	return post<LikeStatus>(`/public/builds/${id}/like`);
}

export async function unlikeBuild(id: string): Promise<LikeStatus> {
	return del<LikeStatus>(`/public/builds/${id}/like`);
}

export interface PublicUserProfile {
	pseudo: string;
	created_at: string;
	builds_count: number;
	total_likes_received: number;
}

export async function fetchPublicUser(pseudo: string): Promise<PublicUserProfile> {
	return get<PublicUserProfile>(`/public/users/${encodeURIComponent(pseudo)}`);
}
