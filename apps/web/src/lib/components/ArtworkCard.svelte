<script lang="ts">
	import Plaque from './Plaque.svelte';
	import type { Artwork } from '$lib/types';

	let { artwork } = $props<{ artwork: Artwork }>();

	const selected = $derived.by(() =>
		artwork.painting_candidates?.find((c: any) => c.id === artwork.selected_candidate_id) ?? null
	);
</script>

<article class="card">
	<div class="frame">
		<img class="img" src={artwork.image_url} alt="Uploaded painting" loading="lazy" />
	</div>

	<div class="meta">
		<div class="museum">
			{artwork.museum_name}
			{#if artwork.museum_city || artwork.museum_country}
				<span class="muted">
					· {artwork.museum_city ?? ''}{artwork.museum_city && artwork.museum_country ? ', ' : ''}
					{artwork.museum_country ?? ''}
				</span>
			{/if}
		</div>
		{#if artwork.saw_date}
			<div class="muted">Seen: {artwork.saw_date}</div>
		{/if}
		{#if artwork.opinion}
			<div class="opinion">“{artwork.opinion}”</div>
		{/if}
	</div>

	{#if selected}
		<Plaque
			artist={selected.artist}
			title={selected.title}
			date_created={selected.date_created}
			location_painted={selected.location_painted}
			style={selected.style}
			medium={selected.medium}
		/>
	{:else}
		<div class="pending">
			<span class="tag">{artwork.status}</span>
			<span class="muted">Plaque will appear after you confirm a match.</span>
		</div>
	{/if}
</article>

<style>
	.card {
		display: grid;
		gap: 10px;
	}
	.frame {
		position: relative;
		border-radius: 18px;
		padding: 14px;
		background:
			linear-gradient(135deg, rgba(184, 138, 42, 0.95), rgba(120, 78, 24, 0.9));
		box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
	}
	.frame::before {
		content: '';
		position: absolute;
		inset: 8px;
		border-radius: 14px;
		border: 1px solid rgba(255, 255, 255, 0.35);
		pointer-events: none;
	}
	.img {
		display: block;
		width: 100%;
		aspect-ratio: 4 / 5;
		object-fit: cover;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.3);
		box-shadow: inset 0 0 0 1px rgba(27, 27, 27, 0.18);
	}
	.meta {
		padding: 4px 2px;
	}
	.museum {
		font-weight: 650;
	}
	.muted {
		color: rgba(27, 27, 27, 0.65);
		font-weight: 500;
	}
	.opinion {
		margin-top: 4px;
		color: rgba(27, 27, 27, 0.78);
	}
	.pending {
		padding: 10px 12px;
		border-radius: 14px;
		border: 1px dashed rgba(27, 27, 27, 0.18);
		background: rgba(255, 255, 255, 0.6);
		display: grid;
		gap: 6px;
	}
	.tag {
		display: inline-block;
		font-size: 0.85rem;
		letter-spacing: 0.02em;
		padding: 4px 8px;
		border-radius: 999px;
		border: 1px solid rgba(27, 27, 27, 0.14);
		background: rgba(255, 255, 255, 0.75);
		width: fit-content;
	}
</style>


