<script lang="ts">
	import { extractTextSignals, type TextSignals } from '$lib/magic/extractTextSignals';

	let { open, onClose, onCreated } = $props<{
		open: boolean;
		onClose: () => void;
		onCreated: (artworkId: string) => void;
	}>();

	let file = $state<File | null>(null);
	let museum_name = $state('');
	let museum_city = $state('');
	let museum_country = $state('');
	let saw_date = $state('');
	let opinion = $state('');

	let busy = $state(false);
	let errorMsg = $state<string | null>(null);

	let signals = $state<TextSignals | null>(null);
	let extracting = $state(false);

	const close = () => {
		if (busy) return;
		onClose();
	};

	$effect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	const onPickFile = async (f: File | null) => {
		file = f;
		signals = null;
		if (!file) return;

		extracting = true;
		try {
			// Caption first; OCR is optional because it's heavier.
			signals = await extractTextSignals(file, { doOcr: false });
		} finally {
			extracting = false;
		}
	};

	const doOcrNow = async () => {
		if (!file) return;
		extracting = true;
		try {
			signals = await extractTextSignals(file, { doOcr: true });
		} finally {
			extracting = false;
		}
	};

	const submit = async () => {
		errorMsg = null;
		if (!file) {
			errorMsg = 'Please pick an image.';
			return;
		}
		if (!museum_name.trim()) {
			errorMsg = 'Museum name is required.';
			return;
		}

		busy = true;
		try {
			const fd = new FormData();
			fd.set('image', file);
			fd.set('museum_name', museum_name.trim());
			fd.set('museum_city', museum_city.trim());
			fd.set('museum_country', museum_country.trim());
			fd.set('saw_date', saw_date);
			fd.set('opinion', opinion.trim());
			if (signals) fd.set('textSignals', JSON.stringify(signals));

			const res = await fetch('/api/artworks', { method: 'POST', body: fd });
			if (!res.ok) throw new Error(await res.text());
			const json = (await res.json()) as { artwork?: { id: string } };

			if (json.artwork?.id) onCreated(json.artwork.id);
			onClose();
		} catch (e: any) {
			errorMsg = e?.message ?? 'Upload failed';
		} finally {
			busy = false;
		}
	};
</script>

{#if open}
	<div
		class="backdrop"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) close();
		}}
	>
		<div
			class="modal"
			tabindex="-1"
			role="dialog"
			aria-modal="true"
		>
			<header class="head">
				<h2>Add a painting</h2>
				<button class="x" type="button" onclick={close} aria-label="Close">×</button>
			</header>

			<form
				class="form"
				onsubmit={(e) => {
					e.preventDefault();
					submit();
				}}
			>
				<label class="field">
					<span>Photo</span>
					<input
						type="file"
						accept="image/*"
						required
						onchange={(e) => onPickFile((e.currentTarget as HTMLInputElement).files?.[0] ?? null)}
					/>
				</label>

				<div class="grid">
					<label class="field">
						<span>Museum name</span>
						<input bind:value={museum_name} placeholder="e.g., Musée d'Orsay" required />
					</label>
					<label class="field">
						<span>Museum city</span>
						<input bind:value={museum_city} placeholder="e.g., Paris" />
					</label>
					<label class="field">
						<span>Museum country</span>
						<input bind:value={museum_country} placeholder="e.g., France" />
					</label>
				</div>

				<label class="field">
					<span>Date seen</span>
					<input bind:value={saw_date} type="date" />
				</label>

				<label class="field">
					<span>Opinion</span>
					<textarea bind:value={opinion} rows="3" placeholder="How did it feel, in that room?"></textarea>
				</label>

				<div class="magic">
					<div class="magicRow">
						<span class="magicLabel">Magic extraction</span>
						<button type="button" class="mini" disabled={!file || extracting} onclick={doOcrNow}>
							{extracting ? 'Working…' : 'Run OCR'}
						</button>
					</div>
					{#if extracting}
						<div class="muted">Extracting caption/OCR (first time may download models)…</div>
					{:else if signals?.caption}
						<div class="muted">Caption: “{signals.caption}”</div>
					{:else if file}
						<div class="muted">Caption unavailable (still OK—museum info helps a lot).</div>
					{/if}
				</div>

				{#if errorMsg}
					<p class="error">{errorMsg}</p>
				{/if}

				<button class="submit" type="submit" disabled={busy}>
					{busy ? 'Uploading…' : 'Upload & identify'}
				</button>
			</form>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.35);
		display: grid;
		place-items: center;
		padding: 18px;
		z-index: 50;
	}
	.modal {
		width: min(720px, 100%);
		background: rgba(255, 255, 255, 0.86);
		border: 1px solid rgba(27, 27, 27, 0.12);
		border-radius: 22px;
		box-shadow: var(--shadow);
		backdrop-filter: blur(10px);
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 16px 10px;
		border-bottom: 1px solid rgba(27, 27, 27, 0.08);
	}
	h2 {
		margin: 0;
	}
	.x {
		border: 0;
		background: transparent;
		font-size: 26px;
		cursor: pointer;
		color: rgba(27, 27, 27, 0.7);
	}
	.form {
		padding: 14px 16px 16px;
		display: grid;
		gap: 12px;
	}
	.field span {
		display: block;
		font-size: 0.92rem;
		color: rgba(27, 27, 27, 0.7);
		margin-bottom: 6px;
	}
	input,
	textarea {
		width: 100%;
		padding: 10px 12px;
		border-radius: 12px;
		border: 1px solid rgba(27, 27, 27, 0.14);
		background: rgba(255, 255, 255, 0.95);
		font-family: inherit;
	}
	.grid {
		display: grid;
		gap: 10px;
	}
	@media (min-width: 720px) {
		.grid {
			grid-template-columns: 2fr 1fr 1fr;
		}
	}
	.magic {
		padding: 10px 12px;
		border-radius: 14px;
		border: 1px solid rgba(27, 27, 27, 0.12);
		background: rgba(244, 239, 227, 0.5);
	}
	.magicRow {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.magicLabel {
		font-weight: 650;
	}
	.mini {
		border: 1px solid rgba(27, 27, 27, 0.14);
		background: rgba(255, 255, 255, 0.8);
		border-radius: 999px;
		padding: 6px 10px;
		cursor: pointer;
	}
	.muted {
		margin-top: 6px;
		color: rgba(27, 27, 27, 0.65);
		font-size: 0.92rem;
	}
	.error {
		margin: 0;
		color: #7a1b1b;
		background: rgba(255, 220, 220, 0.6);
		border: 1px solid rgba(122, 27, 27, 0.22);
		padding: 10px 12px;
		border-radius: 12px;
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
</style>


