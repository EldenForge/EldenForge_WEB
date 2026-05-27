<script lang="ts">
	import { ApiError } from '$lib/api/auth';
	import { createBuild, updateBuild } from '$lib/api/builds';
	import type { BuildPayload } from '$lib/builds/serialize';

	interface Props {
		open: boolean;
		payload: BuildPayload;
		existingBuildId?: string | null;
		existingName?: string;
		existingDescription?: string | null;
		existingIsPublic?: boolean;
		onclose: () => void;
		onsaved?: (buildId: string) => void;
	}

	let {
		open,
		payload,
		existingBuildId = null,
		existingName = '',
		existingDescription = '',
		existingIsPublic = false,
		onclose,
		onsaved
	}: Props = $props();

	let name = $state('');
	let description = $state('');
	let isPublic = $state(false);
	let submitting = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		if (open) {
			name = existingName;
			description = existingDescription ?? '';
			isPublic = existingIsPublic;
			submitting = false;
			error = null;
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = null;
		if (name.trim().length < 1 || name.length > 100) {
			error = 'Name must be 1-100 characters';
			return;
		}

		submitting = true;
		try {
			let saved;
			if (existingBuildId) {
				saved = await updateBuild(existingBuildId, {
					name,
					description: description || null,
					data: payload as unknown as Record<string, unknown>,
					is_public: isPublic
				});
			} else {
				saved = await createBuild({
					name,
					description: description || undefined,
					data: payload as unknown as Record<string, unknown>,
					is_public: isPublic
				});
			}
			onsaved?.(saved.id);
			onclose();
		} catch (e) {
			if (e instanceof ApiError) error = e.detail;
			else if (e instanceof Error) error = e.message;
			else error = 'Unexpected error';
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
			<div class="px-5 py-4 border-b border-dark-400">
				<h3 class="font-cinzel text-gold tracking-wider text-lg">
					{existingBuildId ? 'Update Build' : 'Save Build'}
				</h3>
			</div>

			<form class="p-5 space-y-3" onsubmit={handleSubmit}>
				<div>
					<label class="block text-xs text-gold/60 font-cinzel mb-1 tracking-wider" for="build-name">
						Name
					</label>
					<input
						id="build-name"
						type="text"
						bind:value={name}
						maxlength="100"
						class="w-full bg-dark-800 border border-dark-400 text-parchment rounded px-3 py-2
							text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50"
					/>
				</div>

				<div>
					<label class="block text-xs text-gold/60 font-cinzel mb-1 tracking-wider" for="build-desc">
						Description (optional)
					</label>
					<textarea
						id="build-desc"
						bind:value={description}
						maxlength="2000"
						rows="3"
						class="w-full bg-dark-800 border border-dark-400 text-parchment rounded px-3 py-2
							text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 resize-y"
					></textarea>
				</div>

				<label class="flex items-center gap-2 text-sm text-parchment/80 cursor-pointer">
					<input type="checkbox" bind:checked={isPublic} class="accent-gold" />
					Make this build public
				</label>

				{#if error}
					<p class="text-red-400 text-xs">{error}</p>
				{/if}

				<div class="flex gap-2 pt-2">
					<button type="button" class="btn-reset flex-1" onclick={onclose} disabled={submitting}>
						Cancel
					</button>
					<button type="submit" class="btn-gold flex-1" disabled={submitting}>
						{submitting ? '...' : 'Save'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
