<script lang="ts">
	// Pricing page
</script>

<div class="container">
	<section class="page-header">
		<div class="window">
			<div class="title-bar">
				<button aria-label="Close" class="close"></button>
				<h1 class="title">Pricing Plans</h1>
				<button aria-label="Resize" class="resize"></button>
			</div>
			<div class="separator"></div>
		</div>
	</section>

	<section class="pricing-grid">
		<div class="window pricing-card">
			<div class="title-bar">
				<button aria-label="Close" class="close"></button>
				<h1 class="title">Basic</h1>
				<button aria-label="Resize" disabled class="hidden"></button>
			</div>
			<div class="separator"></div>
			<div class="window-pane">
				<div class="pricing-content">
					<div class="price">
						<span class="amount">$49</span>
						<span class="period">/month</span>
					</div>
					<ul class="features-list">
						<li>Real-time Pump.fun events</li>
						<li>1,000,000 Requests per month</li>
						<li>1 Request per second</li>
						<li>New token launches</li>
						<li>Trades, price updates, bonding progress</li>
						<li>REST + WebSocket access</li>
						<li>Rate-limited</li>
					</ul>
					<button class="btn btn-default">Get Started</button>
				</div>
			</div>
		</div>

		<div class="window pricing-card featured">
			<div class="title-bar">
				<button aria-label="Close" class="close"></button>
				<h1 class="title">Pro</h1>
				<button aria-label="Resize" disabled class="hidden"></button>
			</div>
			<div class="separator"></div>
			<div class="window-pane">
				<div class="pricing-content">
					<div class="price">
						<span class="amount">$200</span>
						<span class="period">/month</span>
					</div>
					<ul class="features-list">
						<li>Everything in Basic</li>
						<li>Price velocity & trend detection</li>
						<li>Buy/sell pressure insights</li>
						<li>Bonding curve velocity</li>
						<li>Raydium listing detection</li>
						<li>Reversal & breakout signals</li>
						<li>Higher rate limits</li>
					</ul>
					<button class="btn btn-default">Get Started</button>
				</div>
			</div>
		</div>

		<div class="window pricing-card">
			<div class="title-bar">
				<button aria-label="Close" class="close"></button>
				<h1 class="title">Custom Integration</h1>
				<button aria-label="Resize" disabled class="hidden"></button>
			</div>
			<div class="separator"></div>
			<div class="window-pane">
				<div class="pricing-content">
					<div class="price">
						<span class="amount">Custom</span>
					</div>
					<ul class="features-list">
						<li>Integration of any Solana program</li>
						<li>External API or private data support</li>
						<li>Custom metrics & event streams</li>
						<li>Dedicated channels & priority support</li>
					</ul>
					<a href="/contact" style="text-decoration: none;">
						<button class="btn btn-default">Contact Us</button>
					</a>
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

	.page-header {
		margin-bottom: 3rem;
	}

	.page-header .window {
		max-width: 50rem;
		margin: 0 auto;
	}

	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.pricing-card {
		display: flex;
		flex-direction: column;
	}

	.pricing-card.featured {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.pricing-content {
		padding: 2rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		flex: 1;
	}

	.price {
		text-align: center;
		padding-bottom: 1rem;
		border-bottom: 2px solid black;
	}

	.amount {
		font-size: 2.5rem;
		font-weight: bold;
		font-family: 'Chicago', 'Times New Roman', serif;
	}

	.period {
		font-size: 1rem;
		color: #666;
	}

	.features-list {
		list-style: none;
		padding: 0;
		margin: 0;
		flex: 1;
	}

	.features-list li {
		padding: 0.5rem 0;
		border-bottom: 1px solid #ccc;
	}

	.features-list li:last-child {
		border-bottom: none;
	}

	.features-list li::before {
		content: '✓ ';
		margin-right: 0.5rem;
	}

	.pricing-content button,
	.pricing-content a {
		width: 100%;
		text-decoration: none;
	}

	.pricing-content button {
		width: 100%;
	}

	@media (max-width: 768px) {
		.pricing-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
