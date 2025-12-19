<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { supabaseBrowser } from '$lib/supabase/browser';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { children } = $props();

	const signOut = async () => {
		await supabaseBrowser.auth.signOut();
		await goto('/login');
	};
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>The Phenomenological Art Gallery</title>
</svelte:head>

<div class="app">
	<header class="topbar">
		<a class="brand" href="/">The Phenomenological Art Gallery</a>
		<nav class="nav">
			<a class="navlink" href="/gallery">Gallery</a>
			{#if $page.data.session}
				<button class="navbtn" type="button" onclick={signOut}>Sign out</button>
			{:else}
				<a class="navlink" href="/login">Sign in</a>
			{/if}
		</nav>
	</header>

	<main class="main">
		{@render children()}
	</main>
</div>

<style>
	:global(:root) {
		--wall: #fbf7ef;
		--wall-2: #fffdf9;
		--ink: #1b1b1b;
		--muted: rgba(27, 27, 27, 0.65);
		--gold: #b88a2a;
		--plaque: #f4efe3;
		--shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
		--radius: 18px;
		font-family: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
		color: var(--ink);
		background: radial-gradient(1200px 600px at 20% 0%, #ffffff 0%, var(--wall) 45%, var(--wall-2) 100%);
	}

	:global(body) {
		margin: 0;
		min-height: 100vh;
	}

	.app {
		min-height: 100vh;
		background:
			radial-gradient(800px 400px at 70% -10%, rgba(184, 138, 42, 0.18), transparent 60%),
			radial-gradient(700px 360px at 10% 10%, rgba(255, 190, 150, 0.22), transparent 60%),
			linear-gradient(180deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0));
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18px 22px;
		backdrop-filter: blur(10px);
		background: rgba(251, 247, 239, 0.7);
		border-bottom: 1px solid rgba(27, 27, 27, 0.08);
	}

	.brand {
		text-decoration: none;
		color: var(--ink);
		letter-spacing: 0.02em;
		font-weight: 650;
	}

	.nav {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.navlink {
		color: var(--ink);
		text-decoration: none;
		opacity: 0.85;
		padding: 8px 10px;
		border-radius: 999px;
	}

	.navlink:hover {
		background: rgba(27, 27, 27, 0.06);
		opacity: 1;
	}

	.navbtn {
		border: 1px solid rgba(27, 27, 27, 0.15);
		background: rgba(255, 255, 255, 0.8);
		color: var(--ink);
		padding: 8px 12px;
		border-radius: 999px;
		cursor: pointer;
	}

	.navbtn:hover {
		border-color: rgba(27, 27, 27, 0.25);
	}

	.main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 28px 18px 80px;
	}
	@media (min-width: 900px) {
		.main {
			padding: 36px 22px 90px;
		}
	}
</style>
