<script lang="ts">
	import { supabaseBrowser } from '$lib/supabase/browser';
	import { goto } from '$app/navigation';

	let mode: 'signin' | 'signup' = 'signin';
	let email = '';
	let password = '';
	let displayName = '';
	let errorMsg: string | null = null;
	let busy = false;

	const submit = async () => {
		errorMsg = null;
		busy = true;
		try {
			if (mode === 'signup') {
				const { error } = await supabaseBrowser.auth.signUp({
					email,
					password,
					options: {
						data: { display_name: displayName }
					}
				});
				if (error) throw error;
			} else {
				const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
				if (error) throw error;
			}

			await goto('/gallery');
		} catch (e: any) {
			errorMsg = e?.message ?? 'Something went wrong';
		} finally {
			busy = false;
		}
	};
</script>

<section class="auth">
	<h1>Sign in</h1>

	<div class="tabs">
		<button class:active={mode === 'signin'} type="button" onclick={() => (mode = 'signin')}>
			Sign in
		</button>
		<button class:active={mode === 'signup'} type="button" onclick={() => (mode = 'signup')}>
			Sign up
		</button>
	</div>

	<form
		class="card"
		onsubmit={(e) => {
			e.preventDefault();
			submit();
		}}
	>
		{#if mode === 'signup'}
			<label>
				<span>Display name</span>
				<input bind:value={displayName} placeholder="Your name" autocomplete="name" />
			</label>
		{/if}

		<label>
			<span>Email</span>
			<input bind:value={email} type="email" autocomplete="email" required />
		</label>

		<label>
			<span>Password</span>
			<input bind:value={password} type="password" autocomplete="current-password" required />
		</label>

		{#if errorMsg}
			<p class="error">{errorMsg}</p>
		{/if}

		<button class="submit" type="submit" disabled={busy}>
			{busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
		</button>

		<p class="hint">
			Note: Supabase may require email confirmation depending on your project settings.
		</p>
	</form>
</section>

<style>
	.auth {
		max-width: 520px;
		margin: 18px auto 0;
	}
	h1 {
		margin: 0 0 12px;
	}
	.tabs {
		display: inline-flex;
		gap: 6px;
		padding: 6px;
		border-radius: 999px;
		background: rgba(27, 27, 27, 0.06);
		margin-bottom: 14px;
	}
	.tabs button {
		border: 0;
		background: transparent;
		padding: 8px 12px;
		border-radius: 999px;
		cursor: pointer;
		color: rgba(27, 27, 27, 0.75);
	}
	.tabs button.active {
		background: rgba(255, 255, 255, 0.85);
		color: rgba(27, 27, 27, 0.95);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
	}
	.card {
		background: rgba(255, 255, 255, 0.7);
		border: 1px solid rgba(27, 27, 27, 0.12);
		border-radius: var(--radius);
		padding: 16px;
		box-shadow: var(--shadow);
		display: grid;
		gap: 12px;
	}
	label span {
		display: block;
		font-size: 0.92rem;
		color: rgba(27, 27, 27, 0.7);
		margin-bottom: 6px;
	}
	input {
		width: 100%;
		padding: 10px 12px;
		border-radius: 12px;
		border: 1px solid rgba(27, 27, 27, 0.14);
		background: rgba(255, 255, 255, 0.95);
	}
	.submit {
		border: 0;
		border-radius: 999px;
		padding: 10px 14px;
		background: rgba(184, 138, 42, 0.92);
		color: #fff;
		cursor: pointer;
	}
	.submit:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}
	.error {
		margin: 0;
		color: #7a1b1b;
		background: rgba(255, 220, 220, 0.6);
		border: 1px solid rgba(122, 27, 27, 0.22);
		padding: 10px 12px;
		border-radius: 12px;
	}
	.hint {
		margin: 6px 0 0;
		font-size: 0.9rem;
		color: rgba(27, 27, 27, 0.65);
	}
</style>


