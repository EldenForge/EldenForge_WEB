<script lang="ts">
	let iframeLoaded = $state(false);
	let iframeBlocked = $state(false);

	function handleLoad() {
		iframeLoaded = true;
	}

	// Detect X-Frame-Options block after a timeout
	let checkTimer: ReturnType<typeof setTimeout>;
	$effect(() => {
		checkTimer = setTimeout(() => {
			if (!iframeLoaded) iframeBlocked = true;
		}, 4000);
		return () => clearTimeout(checkTimer);
	});
</script>

<svelte:head>
	<title>Elden Forge — Map</title>
</svelte:head>

<div class="flex flex-col" style="height: calc(100vh - 2.75rem)">
	<!-- Toolbar -->
	<div class="flex items-center justify-between px-4 py-2 border-b border-gold/15 bg-dark-800/60 shrink-0">
		<div class="flex items-center gap-2">
			<h1 class="font-cinzel text-gold text-sm tracking-widest uppercase">
				Interactive Map
			</h1>
			<span class="text-parchment/20 text-xs">— The Lands Between</span>
		</div>
		<a
			href="https://mapgenie.io/elden-ring/maps/the-lands-between"
			target="_blank"
			rel="noopener noreferrer"
			class="btn-gold text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
		>
			<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
				<polyline points="15 3 21 3 21 9" />
				<line x1="10" y1="14" x2="21" y2="3" />
			</svg>
			Open in MapGenie
		</a>
	</div>

	<!-- Map area -->
	<div class="relative flex-1 bg-dark-900">
		<!-- Loading state -->
		{#if !iframeLoaded && !iframeBlocked}
			<div class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
				<div class="text-center">
					<div class="inline-block w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-4"></div>
					<p class="text-gold font-cinzel text-sm tracking-widest animate-pulse">Loading map...</p>
				</div>
			</div>
		{/if}

		<!-- Blocked fallback -->
		{#if iframeBlocked}
			<div class="absolute inset-0 flex items-center justify-center z-10">
				<div class="card max-w-sm text-center space-y-4">
					<div class="flex justify-center">
						<svg class="w-10 h-10 text-gold/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" />
						</svg>
					</div>
					<div>
						<p class="font-cinzel text-gold text-base tracking-wider mb-1">Map Embed Blocked</p>
						<p class="text-parchment/50 text-sm">
							MapGenie doesn't allow embedding in external sites. Open it directly to use the full interactive map.
						</p>
					</div>
					<a
						href="https://mapgenie.io/elden-ring/maps/the-lands-between"
						target="_blank"
						rel="noopener noreferrer"
						class="btn-gold inline-flex items-center gap-2 mx-auto"
					>
						<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
							<polyline points="15 3 21 3 21 9" />
							<line x1="10" y1="14" x2="21" y2="3" />
						</svg>
						Open MapGenie
					</a>
				</div>
			</div>
		{/if}

		<!-- Iframe -->
		<iframe
			src="https://mapgenie.io/elden-ring/maps/the-lands-between"
			title="Elden Ring Interactive Map — MapGenie"
			class="w-full h-full border-0 {iframeBlocked ? 'opacity-0' : 'opacity-100'}"
			allow="fullscreen"
			onload={handleLoad}
		></iframe>
	</div>
</div>
