<script lang="ts">
	import type { PaintingCandidate } from '$lib/types';

	let { candidates = [], onSelect } = $props<{
		candidates?: PaintingCandidate[];
		onSelect: (candidateId: string) => void;
	}>();

	let selected = $state<string | null>(null);
</script>

<div class="picker">
	<h3>Pick the best match</h3>
	<p class="sub">We’re not perfectly confident—choose the closest plaque.</p>

	<div class="cards">
		{#each candidates as c (c.id)}
			<label class="card">
				<input
					type="radio"
					name="candidate"
					value={c.id}
					bind:group={selected}
				/>
				<div class="meta">
					<div class="title">{c.title ?? 'Unknown title'}</div>
					<div class="line">{c.artist ?? 'Unknown artist'}</div>
					<div class="line small">
						{c.date_created ?? 'Unknown date'} · {c.medium ?? 'Unknown medium'}
					</div>
				</div>
			</label>
		{/each}
	</div>

	<button class="confirm" type="button" disabled={!selected} onclick={() => selected && onSelect(selected)}>
		Confirm plaque
	</button>
</div>

<style>
	.picker {
		margin-top: 14px;
		padding: 14px;
		border-radius: var(--radius);
		border: 1px solid rgba(27, 27, 27, 0.12);
		background: rgba(255, 255, 255, 0.75);
		box-shadow: 0 18px 40px rgba(0, 0, 0, 0.08);
	}
	h3 {
		margin: 0 0 4px;
	}
	.sub {
		margin: 0 0 12px;
		color: rgba(27, 27, 27, 0.65);
	}
	.cards {
		display: grid;
		gap: 10px;
	}
	.card {
		display: grid;
		grid-template-columns: 18px 1fr;
		gap: 10px;
		align-items: start;
		padding: 10px 12px;
		border-radius: 14px;
		border: 1px solid rgba(27, 27, 27, 0.12);
		background: rgba(244, 239, 227, 0.55);
		cursor: pointer;
	}
	.card:hover {
		border-color: rgba(184, 138, 42, 0.35);
	}
	.title {
		font-weight: 650;
	}
	.line {
		color: rgba(27, 27, 27, 0.72);
	}
	.small {
		font-size: 0.9rem;
	}
	.confirm {
		margin-top: 12px;
		border: 0;
		border-radius: 999px;
		padding: 10px 14px;
		background: rgba(184, 138, 42, 0.92);
		color: #fff;
		cursor: pointer;
	}
	.confirm:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
</style>


