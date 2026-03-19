import { CbioIdentity, generateIdentityKeys } from '@the-ai-company/cbio-node-runtime';

async function testSovereignPersistence() {
    const keys = generateIdentityKeys();
    const identity = await CbioIdentity.load(keys);
    await identity.admin.vault.addSecret('az-key', 'super-secret');

    const identityReload = await CbioIdentity.load(keys);
    if (identityReload.admin.vault.getSecret('az-key') === 'super-secret') {
        console.log('✅ Identity persisted successfully');
    }
}
testSovereignPersistence();
