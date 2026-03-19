import type { CbioIdentity } from "@the-ai-company/cbio-node-runtime";

export function getSecret(identity: CbioIdentity, secretName: string): string | undefined {
  return identity.admin.vault.getSecret(secretName);
}

export async function deleteSecret(identity: CbioIdentity, secretName: string): Promise<void> {
  await identity.admin.vault.deleteSecret(secretName);
}
