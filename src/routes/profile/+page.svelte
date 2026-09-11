<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import {
		listMyBuilds,
		deleteBuild,
		listMyLikes,
		type BuildListItem,
		type PublicBuildListItem
	} from '$lib/api/builds';
	import { updatePseudo, changePassword } from '$lib/api/users';
	import { ApiError } from '$lib/api/auth';
	import BuildCard from '$lib/components/BuildCard.svelte';

	type Tab = 'builds' | 'liked' | 'settings';

	function readTabFromUrl(url: URL): Tab {
		const t = url.searchParams.get('tab');
		if (t === 'liked' || t === 'settings' || t === 'builds') return t;
		return 'builds';
	}

	let activeTab = $state<Tab>('builds');

	$effect(() => {
		activeTab = readTabFromUrl($page.url);
	});

	function switchTab(t: Tab) {
		activeTab = t;
		const u = new URL($page.url);
		u.searchParams.set('tab', t);
		goto(u.pathname + u.search, { replaceState: true, noScroll: true, keepFocus: true });
	}

	$effect(() => {
		if ($authStore.bootstrapped && !$authStore.user) {
			goto('/');
		}
	});

	// ── My Builds tab ──
	let myBuilds = $state<BuildListItem[]>([]);
	let myBuildsLoading = $state(true);
	let myBuildsError = $state<string | null>(null);
	let deletingId = $state<string | null>(null);
	let myBuildsLoaded = false;

	async function refreshMyBuilds() {
		myBuildsLoading = true;
		try {
			myBuilds = await listMyBuilds(100, 0);
			myBuildsError = null;
			myBuildsLoaded = true;
		} catch (e) {
			myBuildsError = e instanceof Error ? e.message : 'Failed to load builds';
		} finally {
			myBuildsLoading = false;
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Delete this build?')) return;
		deletingId = id;
		try {
			await deleteBuild(id);
			myBuilds = myBuilds.filter((b) => b.id !== id);
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Failed to delete');
		} finally {
			deletingId = null;
		}
	}

	// ── Liked tab ──
	const LIKED_PAGE_SIZE = 30;
	let liked = $state<PublicBuildListItem[]>([]);
	let likedLoading = $state(true);
	let likedLoadingMore = $state(false);
	let likedError = $state<string | null>(null);
	let likedHasMore = $state(false);
	let likedLoaded = false;

	async function loadLiked(reset = true) {
		if (reset) {
			likedLoading = true;
			liked = [];
		} else {
			likedLoadingMore = true;
		}
		try {
			const p = await listMyLikes(LIKED_PAGE_SIZE, reset ? 0 : liked.length);
			liked = reset ? p : [...liked, ...p];
			likedHasMore = p.length === LIKED_PAGE_SIZE;
			likedError = null;
			likedLoaded = true;
		} catch (e) {
			likedError = e instanceof Error ? e.message : 'Failed to load liked builds';
		} finally {
			likedLoading = false;
			likedLoadingMore = false;
		}
	}

	// Lazy-load per tab on first visit. The `loaded` flag alone is the guard;
	// the `loading` flag stays true until the fetch completes so the UI shows
	// a spinner rather than the empty state during the initial fetch.
	$effect(() => {
		if (!$authStore.user) return;
		if (activeTab === 'builds' && !myBuildsLoaded) {
			refreshMyBuilds();
		} else if (activeTab === 'liked' && !likedLoaded) {
			loadLiked(true);
		}
	});

	// ── Settings: pseudo ──
	let newPseudo = $state('');
	let pseudoSubmitting = $state(false);
	let pseudoError = $state<string | null>(null);
	let pseudoSuccess = $state(false);

	$effect(() => {
		if ($authStore.user && !newPseudo) newPseudo = $authStore.user.pseudo;
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
			if (err instanceof ApiError) pseudoError = err.detail;
			else if (err instanceof Error) pseudoError = err.message;
			else pseudoError = 'Unexpected error';
		} finally {
			pseudoSubmitting = false;
		}
	}

	// ── Settings: password ──
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
			if (err instanceof ApiError) passwordError = err.detail;
			else if (err instanceof Error) passwordError = err.message;
			else passwordError = 'Unexpected error';
		} finally {
			passwordSubmitting = false;
		}
	}

	// ── Logout ──
	let loggingOut = $state(false);
	async function handleLogout() {
		loggingOut = true;
		try {
			await authStore.logout();
			goto('/');
		} finally {
			loggingOut = false;
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

	function formatUpdated(iso: string): string {
		try {
			return new Date(iso).toLocaleString();
		} catch {
			return iso;
		}
	}
</script>

<svelte:head><title>Elden Forge — Profile</title></svelte:head>

{#if !$authStore.bootstrapped || !$authStore.user}
	<div class="flex items-center justify-center min-h-screen">
		<p class="text-gold/50 font-cinzel">Loading...</p>
	</div>
{:else}
	<div class="max-w-6xl mx-auto px-4 py-10">
		<header class="text-center mb-2 relative">
			<h1 class="font-cinzel text-3xl text-gold tracking-[0.2em]">PROFILE</h1>
			<div class="flex items-center justify-center gap-3 mt-3">
				<div class="h-px w-16 bg-gradient-to-r from-transparent to-gold/40"></div>
				<span class="text-gold/50 text-xs">&#9670;</span>
				<div class="h-px w-16 bg-gradient-to-l from-transparent to-gold/40"></div>
			</div>
			<p class="text-parchment/60 text-sm mt-3">
				<span class="text-gold font-cinzel tracking-wider">{$authStore.user.pseudo}</span>
				<span class="text-parchment/30"> · </span>
				<span class="text-parchment/40 text-xs">{$authStore.user.email}</span>
			</p>
			<a
				href="/u/{encodeURIComponent($authStore.user.pseudo)}"
				class="inline-block mt-2 text-xs text-gold/60 hover:text-gold underline font-cinzel tracking-wider"
			>
				View public profile
			</a>
		</header>

		<!-- Tabs -->
		<nav class="flex flex-wrap justify-center gap-2 border-b border-gold/20 mb-6 mt-4" aria-label="Profile sections">
			{#each [{ id: 'builds', label: 'My builds' }, { id: 'liked', label: 'Liked' }, { id: 'settings', label: 'Settings' }] as t}
				<button
					type="button"
					onclick={() => switchTab(t.id as Tab)}
					aria-current={activeTab === t.id ? 'page' : undefined}
					class="relative px-4 py-2 font-cinzel text-xs tracking-widest transition-colors
						{activeTab === t.id ? 'text-gold' : 'text-parchment/50 hover:text-parchment/80'}"
				>
					{t.label}
					{#if activeTab === t.id}
						<span class="absolute left-2 right-2 -bottom-px h-0.5 bg-gold"></span>
					{/if}
				</button>
			{/each}
		</nav>

		{#if activeTab === 'builds'}
			<section aria-label="My builds">
				{#if myBuildsLoading}
					<p class="text-center text-gold/50 font-cinzel py-12">Loading...</p>
				{:else if myBuildsError}
					<div class="card text-center"><p class="text-red-400">{myBuildsError}</p></div>
				{:else if myBuilds.length === 0}
					<div class="card text-center space-y-4 py-10">
						<p class="text-parchment/50 italic">You don't have any saved builds yet.</p>
						<a href="/build" class="btn-gold inline-block">Create your first build</a>
					</div>
				{:else}
					<p class="text-parchment/30 text-xs font-cinzel mb-3">{myBuilds.length} build{myBuilds.length !== 1 ? 's' : ''}</p>
					<div class="space-y-3">
						{#each myBuilds as b (b.id)}
							<div class="card flex items-start gap-4">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-3 mb-1">
										<h3 class="font-cinzel text-gold text-base truncate">{b.name}</h3>
										{#if b.is_public}
											<span class="text-[10px] text-green-400 border border-green-400/40 rounded px-1.5 py-0.5">PUBLIC</span>
										{:else}
											<span class="text-[10px] text-parchment/40 border border-parchment/20 rounded px-1.5 py-0.5">PRIVATE</span>
										{/if}
									</div>
									{#if b.description}
										<p class="text-parchment/60 text-sm line-clamp-2 mb-1">{b.description}</p>
									{/if}
									<p class="text-parchment/30 text-xs">Updated {formatUpdated(b.updated_at)}</p>
								</div>

								<div class="flex flex-col gap-2 shrink-0">
									<a href="/build?build={b.id}" class="btn-gold text-xs px-3 py-1.5">Load</a>
									<button
										class="btn-reset text-xs px-3 py-1.5 hover:!text-red-400 hover:!border-red-400/30"
										onclick={() => handleDelete(b.id)}
										disabled={deletingId === b.id}
									>
										{deletingId === b.id ? '...' : 'Delete'}
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{:else if activeTab === 'liked'}
			<section aria-label="Liked builds">
				{#if likedLoading}
					<p class="text-center text-gold/50 font-cinzel py-12">Loading...</p>
				{:else if likedError}
					<div class="card text-center"><p class="text-red-400">{likedError}</p></div>
				{:else if liked.length === 0}
					<div class="card text-center space-y-4 py-10">
						<p class="text-parchment/50 italic">You haven't liked any build yet.</p>
						<a href="/" class="btn-gold inline-block">Explore builds</a>
					</div>
				{:else}
					<p class="text-parchment/30 text-xs font-cinzel mb-3">
						{liked.length} build{liked.length !== 1 ? 's' : ''}{likedHasMore ? '+' : ''}
					</p>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each liked as build (build.id)}
							<BuildCard {build} />
						{/each}
					</div>
					{#if likedHasMore}
						<div class="text-center mt-8">
							<button class="btn-reset" onclick={() => loadLiked(false)} disabled={likedLoadingMore}>
								{likedLoadingMore ? 'Loading...' : 'Load more'}
							</button>
						</div>
					{/if}
				{/if}
			</section>
		{:else}
			<section aria-label="Settings" class="max-w-2xl mx-auto space-y-6">
				<!-- Account info -->
				<div class="card">
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
				</div>

				<!-- Change pseudo -->
				<div class="card">
					<h2 class="section-title">Change pseudo</h2>
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
							<p class="text-parchment/30 text-[10px] mt-1">3-30 chars, letters/digits/dot/underscore/dash only</p>
						</div>
						{#if pseudoError}<p class="text-red-400 text-xs">{pseudoError}</p>{/if}
						{#if pseudoSuccess}<p class="text-green-400 text-xs italic">Pseudo updated!</p>{/if}
						<div class="flex justify-end">
							<button type="submit" class="btn-gold" disabled={pseudoSubmitting}>
								{pseudoSubmitting ? '...' : 'Save'}
							</button>
						</div>
					</form>
				</div>

				<!-- Change password -->
				<div class="card">
					<h2 class="section-title">Change password</h2>
					<form class="space-y-3" onsubmit={handlePasswordSubmit}>
						<div>
							<label class="block text-xs text-gold/60 font-cinzel mb-1 tracking-wider" for="current-pwd">Current password</label>
							<input
								id="current-pwd"
								type="password"
								bind:value={currentPassword}
								autocomplete="current-password"
								class="w-full bg-dark-800 border border-dark-400 text-parchment rounded px-3 py-2 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
							/>
						</div>
						<div>
							<label class="block text-xs text-gold/60 font-cinzel mb-1 tracking-wider" for="new-pwd">New password</label>
							<input
								id="new-pwd"
								type="password"
								bind:value={newPassword}
								autocomplete="new-password"
								class="w-full bg-dark-800 border border-dark-400 text-parchment rounded px-3 py-2 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
							/>
							<p class="text-parchment/30 text-[10px] mt-1">10+ chars, 1 uppercase, 1 lowercase, 1 digit</p>
						</div>
						<div>
							<label class="block text-xs text-gold/60 font-cinzel mb-1 tracking-wider" for="confirm-pwd">Confirm new password</label>
							<input
								id="confirm-pwd"
								type="password"
								bind:value={confirmPassword}
								autocomplete="new-password"
								class="w-full bg-dark-800 border border-dark-400 text-parchment rounded px-3 py-2 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
							/>
						</div>
						{#if passwordError}<p class="text-red-400 text-xs">{passwordError}</p>{/if}
						{#if passwordSuccess}<p class="text-green-400 text-xs italic">Password changed!</p>{/if}
						<div class="flex justify-end">
							<button type="submit" class="btn-gold" disabled={passwordSubmitting}>
								{passwordSubmitting ? '...' : 'Change password'}
							</button>
						</div>
					</form>
				</div>

				<!-- Logout -->
				<div class="card">
					<h2 class="section-title">Session</h2>
					<div class="flex items-center justify-between">
						<p class="text-parchment/60 text-sm">Log out of this browser.</p>
						<button
							type="button"
							class="btn-reset text-xs px-3 py-1.5 hover:!text-red-400 hover:!border-red-400/30"
							onclick={handleLogout}
							disabled={loggingOut}
						>
							{loggingOut ? '...' : 'Logout'}
						</button>
					</div>
				</div>
			</section>
		{/if}
	</div>
{/if}
