const LinkPage = {
    async render(container) {
        const ready = new URLSearchParams(window.location.hash.split('?')[1] || '').get('ready') === '1';
        container.innerHTML = `
            <div class="auth-container"><div class="auth-card">
                <h1 class="auth-title">Connect your forum account</h1>
                <p class="auth-subtitle">Only verified members with a @127crew.dev email can activate SSI127.</p>
				<p class="text-secondary">A DID is the public identifier for a private signing key stored only in your browser. Generating one does not contact the SSI127 server.</p>
                <div id="forumStep" ${ready ? 'hidden' : ''}>
                    <p class="text-secondary">Continue to the 127crew forum. You will return here automatically after confirming your existing session.</p>
                    <button id="continueForum" class="btn btn-primary btn-full">Continue to forum</button>
                </div>
                <form id="linkForm" class="auth-form" ${ready ? '' : 'hidden'}>
                    <div class="form-group"><label class="form-label" for="linkWallet">Identity</label><select id="linkWallet" class="form-input" required></select></div>
                    <button class="btn btn-primary btn-full" type="submit">Connect identity</button>
                </form>
                <div id="linkStatus" class="auth-status" aria-live="polite"></div>
                <p class="auth-help"><a href="#/login">Back to sign in</a></p>
            </div></div>`;
    },
    async onMount() {
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const ready = params.get('ready') === '1';
        document.getElementById('continueForum')?.addEventListener('click', () => { window.location.href = `${API_CLIENT.baseURL}/auth/forum/start`; });
        if (!ready) return;
        history.replaceState({}, '', '#/link');
        const wallets = await Storage.getWallets();
        const select = document.getElementById('linkWallet');
        select.replaceChildren(...wallets.map(wallet => { const option=document.createElement('option');option.value=wallet.did;option.textContent=wallet.did;return option; }));
        if (!wallets.length) document.getElementById('linkStatus').textContent='Create an identity on the sign-in page before connecting your forum account.';
        document.getElementById('linkForm').addEventListener('submit', async event => {
            event.preventDefault(); const status=document.getElementById('linkStatus');
            try {
                const did=select.value, wallet=await Storage.getWallet(did); if(!wallet) throw new Error('Create an identity before linking your account.');
				status.textContent=wallet.passkeyBackup?'Confirm your passkey…':'Verifying identity…'; const challenge=await API_CLIENT.authChallenge(did); const signature=await CryptoUtils.sign(challenge.nonce,await LoginPage.signingKeyFor(wallet));
                await API_CLIENT.linkIdentity(did,challenge.nonce,signature); status.textContent='Identity connected. You can now sign in.'; setTimeout(()=>APP_ROUTER.push('/login'),700);
            } catch(error) { status.textContent=`Connection failed: ${error.message}`; }
        });
    }
};
