const LinkPage = {
	async render(container) {
		container.innerHTML = `
			<div class="auth-container"><div class="auth-card">
				<h1 class="auth-title">Connect your forum account</h1>
				<p class="auth-subtitle">Only verified members with a @127crew.dev email can activate SSI127.</p>
				<form id="linkForm" class="auth-form">
					<div class="form-group"><label class="form-label" for="forumToken">Forum session token</label>
					<textarea id="forumToken" class="form-textarea" rows="4" required autocomplete="off" aria-describedby="tokenHint"></textarea>
					<small id="tokenHint" class="form-hint">This token is used once to verify your forum membership and is never saved.</small></div>
					<div class="form-group"><label class="form-label" for="linkWallet">Identity</label><select id="linkWallet" class="form-input" required></select></div>
					<button class="btn btn-primary btn-full" type="submit">Verify and connect</button>
				</form><div id="linkStatus" class="auth-status" aria-live="polite"></div>
				<p class="auth-help"><a href="#/login">Back to sign in</a></p>
			</div></div>`;
	},
	async onMount() {
		const wallets = await Storage.getWallets();
		const select = document.getElementById('linkWallet');
		select.replaceChildren(...wallets.map(wallet => { const option = document.createElement('option'); option.value = wallet.did; option.textContent = wallet.did; return option; }));
		if (!wallets.length) { document.getElementById('linkStatus').textContent = 'Create an identity on the sign-in page before connecting your forum account.'; }
		const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
		if (params.get('forum_token')) { document.getElementById('forumToken').value = params.get('forum_token'); history.replaceState({}, '', '#/link'); }
		document.getElementById('linkForm').addEventListener('submit', async event => {
			event.preventDefault(); const status = document.getElementById('linkStatus');
			try {
				const did = select.value, wallet = await Storage.getWallet(did);
				if (!wallet) throw new Error('Create an identity before linking your account.');
				status.textContent = 'Requesting a one-time forum assertion…';
				const linkToken = await exchangeForumSessionForLinkToken(document.getElementById('forumToken').value.trim());
				status.textContent = 'Verifying membership and identity…';
				const challenge = await API_CLIENT.authChallenge(did);
				const signature = await CryptoUtils.sign(challenge.nonce, wallet.privateKey);
				await API_CLIENT.linkIdentity(linkToken, did, challenge.nonce, signature);
				document.getElementById('forumToken').value = '';
				status.textContent = 'Identity connected. You can now sign in.';
				setTimeout(() => APP_ROUTER.push('/login'), 700);
			} catch (error) { status.textContent = `Connection failed: ${error.message}`; }
		});
	}
};
