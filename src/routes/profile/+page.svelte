<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';
	import { updatePseudo, changePassword } from '$lib/api/users';
	import { ApiError } from '$lib/api/auth';

	// Guard: redirect if not logged in (after bootstrap completes)
	$effect(() => {
		if ($authStore.bootstrapped && !$authStore.user) {
			goto('/');
		}
	});

	// ── Pseudo form ──
	let newPseudo = $state('');
	let pseudoSubmitting = $state(false);
	let pseudoError = $state<string | null>(null);
	let pseudoSuccess = $state(false);

	$effect(() => {
		if ($authStore.user) {
			newPseudo = $authStore.user.pseudo;
		}
	});

	function clientValidatePseudo(p: string): string | null {
		if (p.length < 3 || p.length > 30) return 'Pseudo must be 3-30 characters';
		if (!/^[A-Za-z0-9_.-]+$/.test(p)) return 'Pseudo: letters, digits, . _ - only';
		return null;
	}

	async function handlePseudoSubmit(e: SubmitEvent) {
		e.preventDefault();
		pseudoError = null;
		pseudoSuccess = false;

		if (!$authStore.user) return;
		if (newPseudo === $authStore.user.pseudo) {
			pseudoError = 'New pseudo must be different';
			return;
		}
		const validationError = clientValidatePseudo(newPseudo);
		if (validationError) {
			pseudoError = validationError;
			return;
		}

		pseudoSubmitting = true;
		try {
			const updated = await updatePseudo(newPseudo);
			authStore._setUser(updated);
			pseudoSuccess = true;
		} catch (err) {
			if (err instanceof ApiError) {
				pseudoError = err.detail;
			} else if (err instanceof Error) {
				pseudoError = err.message;
			} else {
				pseudoError = 'Unexpected error';
			}
		} finally {
			pseudoSubmitting = false;
		}
	}

	// ── Password form ──
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordSubmitting = $state(false);
	let passwordError = $state<string | null>(null);
	let passwordSuccess = $state(false);

	function clientValidateNewPassword(p: string): string | null {
		if (p.length < 10) return 'Password must be at least 10 characters';
		if (!/[A-Z]/.test(p)) return 'Password must contain an uppercase letter';
		if (!/[a-z]/.test(p)) return 'Password must contain a lowercase letter';
		if (!/\d/.test(p)) return 'Password must contain a digit';
		return null;
	}

	async function handlePasswordSubmit(e: SubmitEvent) {
		e.preventDefault();
		passwordError = null;
		passwordSuccess = false;

		if (!currentPassword) {
			passwordError = 'Current password required';
			return;
		}
		if (newPassword !== confirmPassword) {
			passwordError = 'New password and confirmation do not match';
			return;
		}
		const validationError = clientValidateNewPassword(newPassword);
		if (validationError) {
			passwordError = validationError;
			return;
		}

		passwordSubmitting = true;
		try {
			await changePassword(currentPassword, newPassword);
			passwordSuccess = true;
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} catch (err) {
			if (err instanceof ApiError) {
				passwordError = err.detail;
			} else if (err instanceof Error) {
				passwordError = err.message;
			} else {
				passwordError = 'Unexpected error';
			}
		} finally {
			passwordSubmitting = false;
		}
	}

	function formatDate(iso: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleString();
		} catch {
			return iso;
		}
	}
</script>

<svelte:head>
	<title>Elden Forge — Profile</title>
</svelte:head>

{#if !$authStore.bootstrapped || !$authStore.user}
	<div class="flex items-center justify-center min-h-screen">
		<p class="text-gold/50 font-cinzel">Loading...</p>
	</div>
{:else}
	<div class="max-w-2xl mx-auto px-4 py-10 space-y-6">
		<header class="text-center">
			<h1 class="font-cinzel text-3xl text-gold tracking-[0.2em]">PROFILE</h1>
			<div class="flex items-center justify-center gap-3 mt-3">
				<div class="h-px w-16 bg-gradient-to-r from-transparent to-gold/40"></div>
				<span class="text-gold/50 text-xs">&#9670;</span>
				<div class="h-px w-16 bg-gradient-to-l from-transparent to-gold/40"></div>
			</div>
		</header>

		<!-- Account info (read-only) -->
		<section class="card">
			<h2 class="section-title">Account</h2>
			<dl class="grid grid-cols-3 gap-y-3 text-sm">
				<dt class="text-gold/60 font-cinzel tracking-wider text-xs uppercase">Email</dt>
				<dd class="col-span-2 text-parchment">{$authStore.user.email}</dd>

				<dt class="text-gold/60 font-cinzel tracking-wider text-xs uppercase">Email verified</dt>
				<dd class="col-span-2 text-parchment">
					{#if $authStore.user.email_verified_at}
						<span class="text-green-400">{formatDate($authStore.user.email_verified_at)}</span>
					{:else}
						<span class="text-red-400">Not verified</span>
					{/if}
				</dd>

				<dt class="text-gold/60 font-cinzel tracking-wider text-xs uppercase">Created</dt>
				<dd class="col-span-2 text-parchment">{formatDate($authStore.user.created_at)}</dd>
			</dl>
		</section>

		<!-- Change pseudo -->
		<section class="card">
			<h2 class="section-title">Change Pseudo</h2>
			<form class="space-y-3" onsubmit={handlePseudoSubmit}>
				<div>
					<label class="block text-xs text-gold/60 font-cinzel mb-1 tracking-wider" for="new-pseudo">
						New pseudo
					</label>
					<input
						id="new-pseudo"
						type="text"
						bind:value={newPseudo}
						autocomplete="username"
						class="w-full bg-dark-800 border border-dark-400 text-parchment rounded px-3 py-2
							text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
					/>
					<p class="text-parchment/30 text-[10px] mt-1">
						3-30 chars, letters/digits/dot/underscore/dash only
					</p>
				</div>

				{#if pseudoError}
					<p class="text-red-400 text-xs">{pseudoError}</p>
				{/if}
				{#if pseudoSuccess}
					<p class="text-green-400 text-xs italic">Pseudo updated!</p>
				{/if}

				<div class="flex justify-end">
					<button type="submit" class="btn-gold" disabled={pseudoSubmitting}>
						{pseudoSubmitting ? '...' : 'Save'}
					</button>
				</div>
			</form>
		</section>

		<!-- Change password -->
		<section class="card">
			<h2 class="section-title">Change Password</h2>
			<form class="space-y-3" onsubmit={handlePasswordSubmit}>
				<div>
					<label class="block text-xs text-gold/60 font-cinzel mb-1 tracking-wider" for="current-pwd">
						Current password
					</label>
					<input
						id="current-pwd"
						type="password"
						bind:value={currentPassword}
						autocomplete="current-password"
						class="w-full bg-dark-800 border border-dark-400 text-parchment rounded px-3 py-2
							text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
					/>
				</div>

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
						Confirm new password
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

				{#if passwordError}
					<p class="text-red-400 text-xs">{passwordError}</p>
				{/if}
				{#if passwordSuccess}
					<p class="text-green-400 text-xs italic">Password changed!</p>
				{/if}

				<div class="flex justify-end">
					<button type="submit" class="btn-gold" disabled={passwordSubmitting}>
						{passwordSubmitting ? '...' : 'Change Password'}
					</button>
				</div>
			</form>
		</section>
	</div>
{/if}
