import { patch, post } from './client';
import type { UserOut } from './auth';

export async function updatePseudo(pseudo: string): Promise<UserOut> {
	return patch<UserOut>('/users/me', { pseudo });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
	await post<{ ok: boolean }>('/users/me/password', {
		current_password: currentPassword,
		new_password: newPassword
	});
}
