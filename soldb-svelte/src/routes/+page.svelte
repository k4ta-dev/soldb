<script lang="ts">
	// Landing page hero section
</script>

<div class="container">
	<section class="hero">
		<div class="window hero-window">
			<div class="title-bar">
				<button aria-label="Close" class="close"></button>
				<h1 class="title">Welcome to SOLRAT</h1>
				<button aria-label="Resize" class="resize"></button>
			</div>
			<div class="separator"></div>

			<div class="window-pane">
				<div class="hero-content">
					<h2 class="hero-title">Real-time, decoded blockchain data from Solana</h2>
					<p class="hero-description">
						Get real-time data for everything happening on Pump.fun, or request a custom data
						integration for any Solana program or external source you need.
					</p>

					<div class="hero-actions">
						<a href="/docs">
							<button class="btn">Documentation</button>
						</a>
						<a href="/pricing">
							<button class="btn">See Pricing</button>
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="features">
		<div class="features-grid">
			<div class="window feature-card">
				<div class="title-bar">
					<button aria-label="Close" class="close"></button>
					<h1 class="title">Real-Time Data</h1>
					<button aria-label="Resize" disabled class="hidden"></button>
				</div>
				<div class="separator"></div>
				<div class="window-pane">
					<p>
						Live on-chain events delivered instantly: launches, trades, price updates, and program
						activity.
					</p>
				</div>
			</div>

			<div class="window feature-card">
				<div class="title-bar">
					<button aria-label="Close" class="close"></button>
					<h1 class="title">Pump.fun Support</h1>
					<button aria-label="Resize" disabled class="hidden"></button>
				</div>
				<div class="separator"></div>
				<div class="window-pane">
					<p>
						Full coverage of Pump.fun tokens from launch to listing — already parsed and structured.
					</p>
				</div>
			</div>

			<div class="window feature-card">
				<div class="title-bar">
					<button aria-label="Close" class="close"></button>
					<h1 class="title">Custom Integrations</h1>
					<button aria-label="Resize" disabled class="hidden"></button>
				</div>
				<div class="separator"></div>
				<div class="window-pane">
					<p>Need other data? We can add any Solana program or external source on request.</p>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.hero {
		margin-bottom: 4rem;
		display: flex;
		justify-content: center;
	}

	.hero-window {
		width: 100%;
		max-width: 50rem;
	}

	.hero-content {
		padding: 2rem;
		text-align: center;
	}

	.hero-title {
		font-size: 2rem;
		margin-bottom: 1rem;
		font-family: 'Chicago', 'Times New Roman', serif;
	}

	.hero-description {
		font-size: 1.1rem;
		line-height: 1.6;
		margin-bottom: 2rem;
		color: #333;
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.hero-actions a {
		text-decoration: none;
	}

	.section-title {
		text-align: center;
		font-size: 1.75rem;
		margin-bottom: 2rem;
		font-family: 'Chicago', 'Times New Roman', serif;
	}

	.features {
		margin-bottom: 4rem;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
	}

	.feature-card {
		height: 100%;
	}

	.feature-card .window-pane {
		padding: 1.5rem;
	}

	.feature-card p {
		margin: 0;
		line-height: 1.5;
	}

	.cta {
		margin: 4rem 0;
		display: flex;
		justify-content: center;
	}

	.standard-dialog {
		padding: 2rem;
		max-width: 40rem;
	}

	.standard-dialog a {
		text-decoration: none;
	}

	@media (max-width: 768px) {
		.hero-content {
			padding: 1rem;
		}

		.hero-title {
			font-size: 1.5rem;
		}

		.hero-description {
			font-size: 1rem;
		}

		.features-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
