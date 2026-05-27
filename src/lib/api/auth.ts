import { post, get, ApiError } from './client';

export interface UserOut {
	id: string;
	email: string;
	pseudo: string;
	email_verified_at: string | null;
	created_at: string;
}

export interface RegisterInput {
	email: string;
	pseudo: string;
	password: string;
}

export interface LoginInput {
	email: string;
	password: string;
}

export async function register(data: RegisterInput): Promise<UserOut> {
	return post<UserOut>('/auth/register', data);
}

export async function login(data: LoginInput): Promise<UserOut> {
	return post<UserOut>('/auth/login', data);
}

export async function logout(): Promise<void> {
	await post<void>('/auth/logout');
}

export async function refresh(): Promise<void> {
	await post<void>('/auth/refresh');
}

export async function fetchMe(): Promise<UserOut | null> {
	try {
		return await get<UserOut>('/auth/me');
	} catch (e) {
		if (e instanceof ApiError && e.status === 401) {
			return null;
		}
		throw e;
	}
}

export async function forgotPassword(email: string): Promise<void> {
	await post<void>('/auth/forgot', { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
	await post<void>('/auth/reset', { token, new_password: newPassword });
}

export async function verifyEmail(token: string): Promise<void> {
	await get<{ ok: boolean }>(`/auth/verify?token=${encodeURIComponent(token)}`);
}

export { ApiError };
