<script lang="ts">
	let { title = '404' }: { title?: string } = $props();
</script>

<div class="container">
	<div class="window">
		<div class="title-bar">
			<button aria-label="Close" class="close"></button>
			<h1 class="title">{title}</h1>
			<button aria-label="Resize" class="resize"></button>
		</div>
		<div class="separator"></div>

		<div class="window-pane">
			<div class="content">
				<h2>🚧 Under Construction</h2>
				<p>This page is not available yet.</p>
				<a href="/">
					<button class="btn">Back to Home</button>
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	.container {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem 1rem;
		min-height: calc(100vh - 120px);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.content {
		padding: 2rem;
		text-align: center;
	}

	h2 {
		font-family: 'Chicago', 'Times New Roman', serif;
		font-size: 1.75rem;
		margin: 0 0 1rem 0;
	}

	p {
		margin: 0 0 2rem 0;
	}

	a {
		text-decoration: none;
	}

	@media (max-width: 768px) {
		h2 {
			font-size: 1.5rem;
		}
	}
</style>
