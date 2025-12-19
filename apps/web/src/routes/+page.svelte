<section class="hero">
	<h1 class="title">The Phenomenological Art Gallery</h1>
	<p class="subtitle">
		Upload a photo of a painting you encountered. We’ll propose 3 likely matches, generate a frame, and
		engrave a museum-style plaque.
	</p>

	<div class="cta">
		<a class="btn" href="/gallery">Enter your gallery</a>
		<a class="btn ghost" href="/login">Sign in</a>
	</div>
</section>

<style>
	.hero {
		padding: 46px 0 10px;
	}
	.title {
		font-size: clamp(2rem, 4vw, 3rem);
		margin: 0 0 10px;
		letter-spacing: 0.02em;
	}
	.subtitle {
		max-width: 62ch;
		margin: 0 0 22px;
		color: rgba(27, 27, 27, 0.7);
		line-height: 1.5;
	}
	.cta {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}
	.btn {
		display: inline-block;
		text-decoration: none;
		background: rgba(184, 138, 42, 0.92);
		color: #fff;
		padding: 10px 14px;
		border-radius: 999px;
		box-shadow: 0 12px 30px rgba(184, 138, 42, 0.22);
	}
	.btn.ghost {
		background: rgba(255, 255, 255, 0.75);
		color: rgba(27, 27, 27, 0.9);
		border: 1px solid rgba(27, 27, 27, 0.14);
		box-shadow: none;
	}
</style>
