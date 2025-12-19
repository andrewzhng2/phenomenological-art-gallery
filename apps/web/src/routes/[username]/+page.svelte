<script lang="ts">
	import ArtworkCard from '$lib/components/ArtworkCard.svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
</script>

<section class="page">
	<div class="heading">
		<h1>{data.profile.display_name ?? data.profile.username}’s gallery</h1>
		<p class="sub">
			{#if data.profile.age_years !== null && data.profile.age_years !== undefined}
				Age: {data.profile.age_years}
				<span class="muted">·</span>
			{/if}
			Public gallery
		</p>
	</div>

	{#if data.artworks.length === 0}
		<div class="empty">
			<p>No confirmed paintings yet.</p>
		</div>
	{:else}
		<div class="grid">
			{#each data.artworks as a (a.artwork_id)}
				<!-- Public gallery uses a slightly different shape; normalize for the card -->
				<ArtworkCard
					artwork={{
						id: a.artwork_id,
						image_url: a.image_url,
						museum_name: a.museum_name,
						museum_city: a.museum_city,
						museum_country: a.museum_country,
						saw_date: a.saw_date,
						opinion: a.opinion,
						status: 'confirmed',
						selected_candidate_id: 'public',
						painting_candidates: [
							{
								id: 'public',
								rank: 1,
								confidence: null,
								artist: a.artist,
								title: a.title,
								date_created: a.date_created,
								location_painted: a.location_painted,
								style: a.style,
								medium: a.medium,
								source: 'public'
							}
						]
					}}
				/>
			{/each}
		</div>
	{/if}
</section>

<style>
	.heading h1 {
		margin: 0 0 6px;
	}
	.sub {
		margin: 0;
		color: rgba(27, 27, 27, 0.7);
	}
	.muted {
		color: rgba(27, 27, 27, 0.65);
		padding: 0 6px;
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
</style>


