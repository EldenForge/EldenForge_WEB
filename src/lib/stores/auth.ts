import { writable } from 'svelte/store';
import { fetchMe, login as apiLogin, logout as apiLogout, register as apiRegister } from '$lib/api/auth';
import type { UserOut, RegisterInput, LoginInput } from '$lib/api/auth';

interface AuthState {
	user: UserOut | null;
	loading: boolean;
	bootstrapped: boolean;
	error: string | null;
}

const initial: AuthState = {
	user: null,
	loading: false,
	bootstrapped: false,
	error: null
};

function createAuthStore() {
	const { subscribe, update, set } = writable<AuthState>(initial);

	return {
		subscribe,

		async bootstrap() {
			update((s) => ({ ...s, loading: true }));
			try {
				const user = await fetchMe();
				update((s) => ({ ...s, user, loading: false, bootstrapped: true, error: null }));
			} catch (e) {
				update((s) => ({
					...s,
					user: null,
					loading: false,
					bootstrapped: true,
					error: e instanceof Error ? e.message : 'Failed to load user'
				}));
			}
		},

		async login(data: LoginInput) {
			update((s) => ({ ...s, loading: true, error: null }));
			try {
				const user = await apiLogin(data);
				update((s) => ({ ...s, user, loading: false, error: null }));
				return user;
			} catch (e) {
				const msg = e instanceof Error ? e.message : 'Login failed';
				update((s) => ({ ...s, loading: false, error: msg }));
				throw e;
			}
		},

		async register(data: RegisterInput) {
			update((s) => ({ ...s, loading: true, error: null }));
			try {
				const user = await apiRegister(data);
				update((s) => ({ ...s, loading: false, error: null }));
				return user;
			} catch (e) {
				const msg = e instanceof Error ? e.message : 'Registration failed';
				update((s) => ({ ...s, loading: false, error: msg }));
				throw e;
			}
		},

		async logout() {
			update((s) => ({ ...s, loading: true }));
			try {
				await apiLogout();
			} catch {
				// Even if the server fails we still clear locally
			}
			set({ ...initial, bootstrapped: true });
		},

		clearError() {
			update((s) => ({ ...s, error: null }));
		},

		_setUser(user: UserOut | null) {
			update((s) => ({ ...s, user, bootstrapped: true }));
		}
	};
}

export const authStore = createAuthStore();
export type { UserOut, AuthState };
