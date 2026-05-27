<script lang="ts">
	import { page } from '$app/stores';
	import { resetPassword, ApiError } from '$lib/api/auth';

	const token = $derived($page.url.searchParams.get('token') ?? '');

	let newPassword = $state('');
	let confirmPassword = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	function clientValidate(pwd: string): string | null {
		if (pwd.length < 10) return 'Password must be at least 10 characters';
		if (!/[A-Z]/.test(pwd)) return 'Password must contain an uppercase letter';
		if (!/[a-z]/.test(pwd)) return 'Password must contain a lowercase letter';
		if (!/\d/.test(pwd)) return 'Password must contain a digit';
		return null;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = null;

		if (!token) {
			error = 'Missing token in URL';
			return;
		}
		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}
		const validationError = clientValidate(newPassword);
		if (validationError) {
			error = validationError;
			return;
		}

		submitting = true;
		try {
			await resetPassword(token, newPassword);
			success = true;
		} catch (e) {
			if (e instanceof ApiError) {
				error = e.detail;
			} else if (e instanceof Error) {
				error = e.message;
			} else {
				error = 'Reset failed';
			}
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Elden Forge — Reset Password</title>
</svelte:head>

<div class="flex items-center justify-center min-h-[80vh] px-4">
	<div class="card max-w-md w-full space-y-4">
		<header class="text-center">
			<h1 class="font-cinzel text-gold text-2xl tracking-[0.2em]">RESET PASSWORD</h1>
			<div class="flex items-center justify-center gap-3 mt-2">
				<div class="h-px w-12 bg-gradient-to-r from-transparent to-gold/40"></div>
				<span class="text-gold/50 text-xs">&#9670;</span>
				<div class="h-px w-12 bg-gradient-to-l from-transparent to-gold/40"></div>
			</div>
		</header>

		{#if success}
			<div class="text-center space-y-3 py-2">
				<p class="text-green-400 font-cinzel">✓ Password reset !</p>
				<p class="text-parchment/70 text-sm">You can now log in with your new password.</p>
				<a href="/" class="btn-gold inline-block mt-2">Go to home</a>
			</div>
		{:else if !token}
			<div class="text-center py-4">
				<p class="text-red-400">Missing token in URL.</p>
				<a href="/" class="btn-reset inline-block mt-3">Back to home</a>
			</div>
		{:else}
			<form class="space-y-3" onsubmit={handleSubmit}>
				<div>
					<label class="block text-xs text-gold/60 font-cinzel mb-1 tracking-wider" for="new-pwd">
						New password
					</label>
					<input
						id="new-pwd"
						type="password"
						bind:value={newPassword}
						autocomplete="new-password"
						class="w-full bg-dark-800 border border-dark-400 text-parchment rounded px-3 py-2
							text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
					/>
					<p class="text-parchment/30 text-[10px] mt-1">
						10+ chars, 1 uppercase, 1 lowercase, 1 digit
					</p>
				</div>

				<div>
					<label class="block text-xs text-gold/60 font-cinzel mb-1 tracking-wider" for="confirm-pwd">
						Confirm password
					</label>
					<input
						id="confirm-pwd"
						type="password"
						bind:value={confirmPassword}
						autocomplete="new-password"
						class="w-full bg-dark-800 border border-dark-400 text-parchment rounded px-3 py-2
							text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
					/>
				</div>

				{#if error}
					<p class="text-red-400 text-xs">{error}</p>
				{/if}

				<button type="submit" class="btn-gold w-full" disabled={submitting}>
					{submitting ? '...' : 'Reset password'}
				</button>
			</form>
		{/if}
	</div>
</div>
