<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { ApiError, forgotPassword } from '$lib/api/auth';

	interface Props {
		open: boolean;
		onclose: () => void;
		onsuccess?: () => void;
		initialTab?: 'login' | 'register';
	}

	let { open, onclose, onsuccess, initialTab = 'login' }: Props = $props();

	type Mode = 'login' | 'register' | 'forgot';
	let mode = $state<Mode>('login');
	let email = $state('');
	let pseudo = $state('');
	let password = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let infoMessage = $state<string | null>(null);

	$effect(() => {
		if (open) {
			mode = initialTab;
			email = '';
			pseudo = '';
			password = '';
			error = null;
			infoMessage = null;
			submitting = false;
		}
	});

	function switchMode(m: Mode) {
		mode = m;
		error = null;
		infoMessage = null;
	}

	function clientValidate(): string | null {
		if (!email.includes('@')) return 'Enter a valid email';
		if (mode === 'register') {
			if (pseudo.length < 3 || pseudo.length > 30) return 'Pseudo must be 3-30 characters';
			if (!/^[A-Za-z0-9_.-]+$/.test(pseudo)) return 'Pseudo : letters, digits, . _ - only';
			if (password.length < 10) return 'Password must be at least 10 characters';
			if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
			if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
			if (!/\d/.test(password)) return 'Password must contain a digit';
		}
		if (mode !== 'forgot' && !password) return 'Password required';
		return null;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = null;
		infoMessage = null;

		const validationError = clientValidate();
		if (validationError) {
			error = validationError;
			return;
		}

		submitting = true;
		try {
			if (mode === 'login') {
				await authStore.login({ email, password });
				onsuccess?.();
				onclose();
			} else if (mode === 'register') {
				await authStore.register({ email, pseudo, password });
				infoMessage =
					'Account created! Check your email (in dev: API console) to verify, then log in.';
				mode = 'login';
				password = '';
			} else {
				// forgot
				await forgotPassword(email);
				infoMessage =
					'If an account exists with this email, a reset link has been sent. Check your inbox (in dev: API console).';
			}
		} catch (e) {
			if (e instanceof ApiError) {
				error = e.detail;
			} else if (e instanceof Error) {
				error = e.message;
			} else {
				error = 'Unexpected error';
			}
		} finally {
			submitting = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="absolute inset-0 bg-black/70 backdrop-blur-sm"
			role="button"
			tabindex="-1"
			onclick={onclose}
			onkeydown={(e) => e.key === 'Enter' && onclose()}
		></div>

		<div
			class="relative bg-dark-700 border border-gold/30 rounded-xl w-full max-w-sm
				shadow-2xl shadow-black/50"
		>
			{#if mode !== 'forgot'}
				<div class="flex border-b border-dark-400">
					<button
						type="button"
						class="flex-1 px-4 py-3 font-cinzel text-sm tracking-wider transition-colors cursor-pointer
							{mode === 'login'
							? 'text-gold border-b-2 border-gold -mb-px'
							: 'text-parchment/40 hover:text-parchment/70'}"
						onclick={() => switchMode('login')}
					>
						Login
					</button>
					<button
						type="button"
						class="flex-1 px-4 py-3 font-cinzel text-sm tracking-wider transition-colors cursor-pointer
							{mode === 'register'
							? 'text-gold border-b-2 border-gold -mb-px'
							: 'text-parchment/40 hover:text-parchment/70'}"
						onclick={() => switchMode('register')}
					>
						Register
					</button>
				</div>
			{:else}
				<div class="px-5 py-4 border-b border-dark-400">
					<h3 class="font-cinzel text-gold tracking-wider text-base">Forgot Password</h3>
				</div>
			{/if}

			<form class="p-5 space-y-3" onsubmit={handleSubmit}>
				<div>
					<label class="block text-xs text-gold/60 font-cinzel mb-1 tracking-wider" for="email">
						Email
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						autocomplete="email"
						class="w-full bg-dark-800 border border-dark-400 text-parchment rounded px-3 py-2
							text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
					/>
				</div>

				{#if mode === 'register'}
					<div>
						<label class="block text-xs text-gold/60 font-cinzel mb-1 tracking-wider" for="pseudo">
							Pseudo
						</label>
						<input
							id="pseudo"
							type="text"
							bind:value={pseudo}
							autocomplete="username"
							class="w-full bg-dark-800 border border-dark-400 text-parchment rounded px-3 py-2
								text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
						/>
					</div>
				{/if}

				{#if mode !== 'forgot'}
					<div>
						<label class="block text-xs text-gold/60 font-cinzel mb-1 tracking-wider" for="password">
							Password
						</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							autocomplete={mode === 'login' ? 'current-password' : 'new-password'}
							class="w-full bg-dark-800 border border-dark-400 text-parchment rounded px-3 py-2
								text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
						/>
						{#if mode === 'register'}
							<p class="text-parchment/30 text-[10px] mt-1">
								10+ chars, 1 uppercase, 1 lowercase, 1 digit
							</p>
						{/if}
					</div>
				{/if}

				{#if error}
					<p class="text-red-400 text-xs">{error}</p>
				{/if}

				{#if infoMessage}
					<p class="text-gold/70 text-xs italic">{infoMessage}</p>
				{/if}

				<div class="flex gap-2 pt-2">
					<button
						type="button"
						class="btn-reset flex-1"
						onclick={onclose}
						disabled={submitting}
					>
						Cancel
					</button>
					<button type="submit" class="btn-gold flex-1" disabled={submitting}>
						{#if submitting}
							...
						{:else if mode === 'login'}
							Login
						{:else if mode === 'register'}
							Register
						{:else}
							Send link
						{/if}
					</button>
				</div>

				{#if mode === 'login'}
					<div class="text-center pt-2 border-t border-dark-400/40">
						<button
							type="button"
							onclick={() => switchMode('forgot')}
							class="text-parchment/40 hover:text-gold text-xs underline cursor-pointer"
						>
							Forgot password ?
						</button>
					</div>
				{:else if mode === 'forgot'}
					<div class="text-center pt-2 border-t border-dark-400/40">
						<button
							type="button"
							onclick={() => switchMode('login')}
							class="text-parchment/40 hover:text-gold text-xs underline cursor-pointer"
						>
							Back to login
						</button>
					</div>
				{/if}
			</form>
		</div>
	</div>
{/if}
