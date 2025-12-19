<script lang="ts">
	let { onClick } = $props<{ onClick: () => void }>();
</script>

<button class="fab" type="button" onclick={onClick} aria-label="Add a painting">
	<span class="plus">+</span>
</button>

<style>
	.fab {
		position: fixed;
		right: 22px;
		bottom: 22px;
		width: 54px;
		height: 54px;
		border-radius: 999px;
		border: 0;
		cursor: pointer;
		background: rgba(184, 138, 42, 0.96);
		color: white;
		box-shadow: 0 18px 40px rgba(184, 138, 42, 0.3);
		display: grid;
		place-items: center;
	}
	.fab:hover {
		transform: translateY(-1px);
	}
	.plus {
		font-size: 30px;
		line-height: 1;
		transform: translateY(-1px);
	}
</style>


