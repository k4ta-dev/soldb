<script lang="ts">
	// Navigation is currently static, will be connected to auth later
</script>

<nav class="navbar">
	<div class="navbar-container">
		<!-- Left: Brand -->
		<div class="navbar-brand">
			<a href="/" class="brand-link">
				<strong>SOLRAT</strong>
			</a>
		</div>

		<!-- Center: Navigation Links -->
		<ul class="navbar-nav">
			<li>
				<a href="/">Home</a>
			</li>
			<li>
				<a href="/pricing">Pricing</a>
			</li>
			<li>
				<a href="/docs">Docs</a>
			</li>
			<li>
				<a href="/contact">Contact</a>
			</li>
		</ul>

		<!-- Right: Dashboard Button -->
		<div class="navbar-actions">
			<a href="/dashboard">
				<button class="btn btn-default">Dashboard</button>
			</a>
		</div>
	</div>
</nav>

<style>
	.navbar {
		background: white;
		border-bottom: 2px solid black;
		padding: 0.75rem 1rem;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		width: 100%;
		z-index: 1000;
		margin: 0;
		box-sizing: border-box;
	}

	.navbar-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 1200px;
		margin: 0 auto;
		gap: 2rem;
	}

	.navbar-brand {
		flex-shrink: 0;
	}

	.brand-link {
		text-decoration: none;
		color: black;
		font-size: 1.25rem;
		font-family: 'Chicago', 'Times New Roman', serif;
	}

	.brand-link:hover {
		text-decoration: underline;
	}

	.navbar-nav {
		display: flex;
		list-style: none;
		margin: 0;
		padding: 0;
		gap: 0;
		flex: 1;
		justify-content: center;
	}

	.navbar-nav li {
		margin: 0;
		padding: 0.5rem 1rem;
	}

	.navbar-nav li:hover {
		background: black;
	}

	.navbar-nav li:hover a {
		color: white;
	}

	.navbar-nav a {
		text-decoration: none;
		color: black;
		font-weight: normal;
	}

	.navbar-actions {
		flex-shrink: 0;
	}

	.navbar-actions a {
		text-decoration: none;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.navbar-container {
			flex-wrap: wrap;
			gap: 1rem;
		}

		.navbar-brand {
			flex: 1;
		}

		.navbar-actions {
			order: 2;
		}

		.navbar-nav {
			order: 3;
			width: 100%;
			justify-content: space-around;
			flex-wrap: wrap;
		}

		.navbar-nav li {
			padding: 0.5rem;
		}
	}
</style>
