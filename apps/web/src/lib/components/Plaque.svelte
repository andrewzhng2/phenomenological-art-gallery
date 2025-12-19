<script lang="ts">
	let {
		artist = null,
		title = null,
		date_created = null,
		location_painted = null,
		style = null,
		medium = null
	} = $props<{
		artist?: string | null;
		title?: string | null;
		date_created?: string | null;
		location_painted?: string | null;
		style?: string | null;
		medium?: string | null;
	}>();

	let open = $state(false);
</script>

<button class="plaque" type="button" onclick={() => (open = !open)} aria-expanded={open}>
	<div class="plaqueTitle">{title ?? 'Unknown work'}</div>
	<div class="plaqueSub">{artist ?? 'Unknown artist'}{date_created ? ` · ${date_created}` : ''}</div>

	{#if open}
		<div class="rows">
			{#if location_painted}<div class="row"><span>Location</span><span>{location_painted}</span></div>{/if}
			{#if style}<div class="row"><span>Style</span><span>{style}</span></div>{/if}
			{#if medium}<div class="row"><span>Medium</span><span>{medium}</span></div>{/if}
		</div>
	{/if}
</button>

<style>
	.plaque {
		width: 100%;
		text-align: left;
		border: 1px solid rgba(27, 27, 27, 0.18);
		background: linear-gradient(180deg, rgba(244, 239, 227, 0.92), rgba(244, 239, 227, 0.75));
		border-radius: 14px;
		padding: 10px 12px;
		cursor: pointer;
		box-shadow: 0 12px 25px rgba(0, 0, 0, 0.08);
	}
	.plaqueTitle {
		font-weight: 700;
	}
	.plaqueSub {
		color: rgba(27, 27, 27, 0.68);
		font-size: 0.92rem;
		margin-top: 2px;
	}
	.rows {
		margin-top: 10px;
		display: grid;
		gap: 6px;
	}
	.row {
		display: grid;
		grid-template-columns: 84px 1fr;
		gap: 10px;
		font-size: 0.92rem;
		color: rgba(27, 27, 27, 0.78);
	}
	.row span:first-child {
		color: rgba(27, 27, 27, 0.6);
	}
</style>


