<script lang="ts">
	import FabAdd from '$lib/components/FabAdd.svelte';
	import UploadModal from '$lib/components/UploadModal.svelte';
	import ArtworkCard from '$lib/components/ArtworkCard.svelte';
	import CandidatePicker from '$lib/components/CandidatePicker.svelte';
	import { supabaseBrowser } from '$lib/supabase/browser';
	import type { Artwork } from '$lib/types';

	let artworks: Artwork[] = $state([]);
	let loading = $state(true);
	let modalOpen = $state(false);
	let errorMsg: string | null = $state(null);
	let profileUrl: string | null = $state(null);

	const loadProfileUrl = async () => {
		const { data } = await supabaseBrowser.auth.getUser();
		const user = data.user;
		if (!user) return;
		const { data: p } = await supabaseBrowser
			.from('profiles')
			.select('username')
			.eq('id', user.id)
			.maybeSingle();
		if (p?.username) profileUrl = `/${p.username}`;
	};

	const loadArtworks = async () => {
		loading = true;
		errorMsg = null;
		try {
			const res = await fetch('/api/artworks');
			if (!res.ok) throw new Error(await res.text());
			const json = (await res.json()) as { artworks: Artwork[] };
			artworks = json.artworks;
		} catch (e: any) {
			errorMsg = e?.message ?? 'Failed to load artworks';
		} finally {
			loading = false;
		}
	};

	const selectCandidate = async (artworkId: string, candidateId: string) => {
		errorMsg = null;
		try {
			const res = await fetch(`/api/artworks/${artworkId}/select`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ candidateId })
			});
			if (!res.ok) throw new Error(await res.text());
			await loadArtworks();
		} catch (e: any) {
			errorMsg = e?.message ?? 'Failed to confirm plaque';
		}
	};

	const onCreated = async () => {
		// Identification runs server-side in the upload call; re-fetch to get candidates/status.
		await loadArtworks();
	};

	$effect(() => {
		loadArtworks();
		loadProfileUrl();
	});
</script>

<section class="page">
	<div class="heading">
		<div>
			<h1>Your gallery</h1>
			<p class="sub">
				A bright wall, a quiet plaque, and a memory of the museum room.
				{#if profileUrl}
					<span class="muted">· Public link: <a href={profileUrl}>{profileUrl}</a></span>
				{/if}
			</p>
		</div>
	</div>

	{#if errorMsg}
		<p class="error">{errorMsg}</p>
	{/if}

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if artworks.length === 0}
		<div class="empty">
			<p>No paintings yet.</p>
			<p class="muted">Press the gold + button to add your first one.</p>
		</div>
	{:else}
		<div class="grid">
			{#each artworks as a (a.id)}
				<div class="cell">
					<ArtworkCard artwork={a} />

					{#if a.status === 'candidates_ready' && !a.selected_candidate_id && a.painting_candidates?.length}
						<CandidatePicker
							candidates={a.painting_candidates}
							onSelect={(candidateId) => selectCandidate(a.id, candidateId)}
						/>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</section>

<FabAdd onClick={() => (modalOpen = true)} />
<UploadModal open={modalOpen} onClose={() => (modalOpen = false)} onCreated={() => onCreated()} />

<style>
	.page {
		position: relative;
	}
	.heading h1 {
		margin: 0 0 6px;
	}
	.sub {
		margin: 0;
		color: rgba(27, 27, 27, 0.7);
	}
	.muted {
		color: rgba(27, 27, 27, 0.65);
	}
	.error {
		margin: 12px 0 0;
		color: #7a1b1b;
		background: rgba(255, 220, 220, 0.6);
		border: 1px solid rgba(122, 27, 27, 0.22);
		padding: 10px 12px;
		border-radius: 12px;
	}
	.empty {
		margin-top: 18px;
		padding: 18px;
		border-radius: var(--radius);
		border: 1px dashed rgba(27, 27, 27, 0.18);
		background: rgba(255, 255, 255, 0.55);
	}
	.grid {
		margin-top: 18px;
		display: grid;
		gap: 26px 20px;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	}
	@media (min-width: 980px) {
		.grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	.cell {
		display: grid;
		gap: 10px;
	}
</style>


