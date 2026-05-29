<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { listMyBuilds, deleteBuild, type BuildListItem } from '$lib/api/builds';

	let builds = $state<BuildListItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let deletingId = $state<string | null>(null);

	$effect(() => {
		if ($authStore.bootstrapped && !$authStore.user) {
			goto('/');
		}
	});

	async function refresh() {
		loading = true;
		try {
			builds = await listMyBuilds(100, 0);
			error = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load builds';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if ($authStore.user) refresh();
	});

	$effect(() => {
		if ($authStore.user && builds.length === 0 && !loading && !error) {
			refresh();
		}
	});

	async function handleDelete(id: string) {
		if (!confirm('Delete this build?')) return;
		deletingId = id;
		try {
			await deleteBuild(id);
			builds = builds.filter((b) => b.id !== id);
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Failed to delete');
		} finally {
			deletingId = null;
		}
	}

	function formatDate(iso: string): string {
		try {
			return new Date(iso).toLocaleString();
		} catch {
			return iso;
		}
	}
</script>

<svelte:head>
	<title>Elden Forge — My Builds</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-10">
	<header class="text-center mb-8">
		<h1 class="font-cinzel text-3xl text-gold tracking-[0.2em]">MY BUILDS</h1>
		<div class="flex items-center justify-center gap-3 mt-3">
			<div class="h-px w-16 bg-gradient-to-r from-transparent to-gold/40"></div>
			<span class="text-gold/50 text-xs">&#9670;</span>
			<div class="h-px w-16 bg-gradient-to-l from-transparent to-gold/40"></div>
		</div>
	</header>

	{#if loading}
		<p class="text-center text-gold/50 font-cinzel py-12">Loading...</p>
	{:else if error}
		<div class="card text-center">
			<p class="text-red-400">{error}</p>
		</div>
	{:else if builds.length === 0}
		<div class="card text-center space-y-4">
			<p class="text-parchment/50 italic">You don't have any saved builds yet.</p>
			<a href="/" class="btn-gold inline-block">Create your first build</a>
		</div>
	{:else}
		<div class="space-y-3">
			{#each builds as b (b.id)}
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
						<p class="text-parchment/30 text-xs">Updated {formatDate(b.updated_at)}</p>
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
</div>
