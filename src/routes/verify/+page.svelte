<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { verifyEmail, ApiError } from '$lib/api/auth';

	type Status = 'loading' | 'success' | 'error';
	let status = $state<Status>('loading');
	let errorMessage = $state<string | null>(null);

	onMount(async () => {
		const token = $page.url.searchParams.get('token');
		if (!token) {
			status = 'error';
			errorMessage = 'Missing token in URL';
			return;
		}
		try {
			await verifyEmail(token);
			status = 'success';
		} catch (e) {
			status = 'error';
			if (e instanceof ApiError) {
				errorMessage = e.detail;
			} else if (e instanceof Error) {
				errorMessage = e.message;
			} else {
				errorMessage = 'Verification failed';
			}
		}
	});
</script>

<svelte:head>
	<title>Elden Forge — Verify Email</title>
</svelte:head>

<div class="flex items-center justify-center min-h-[80vh] px-4">
	<div class="card max-w-md w-full text-center space-y-4">
		<h1 class="font-cinzel text-gold text-2xl tracking-[0.2em]">EMAIL VERIFICATION</h1>
		<div class="flex items-center justify-center gap-3">
			<div class="h-px w-12 bg-gradient-to-r from-transparent to-gold/40"></div>
			<span class="text-gold/50 text-xs">&#9670;</span>
			<div class="h-px w-12 bg-gradient-to-l from-transparent to-gold/40"></div>
		</div>

		{#if status === 'loading'}
			<p class="text-parchment/60 italic py-4">Verifying your email...</p>
		{:else if status === 'success'}
			<div class="space-y-3 py-2">
				<p class="text-green-400 font-cinzel">✓ Email verified !</p>
				<p class="text-parchment/70 text-sm">
					Your account is now active. You can log in.
				</p>
				<a href="/" class="btn-gold inline-block mt-2">Go to home</a>
			</div>
		{:else}
			<div class="space-y-3 py-2">
				<p class="text-red-400 font-cinzel">Verification failed</p>
				<p class="text-parchment/70 text-sm">{errorMessage}</p>
				<a href="/" class="btn-reset inline-block mt-2">Back to home</a>
			</div>
		{/if}
	</div>
</div>
