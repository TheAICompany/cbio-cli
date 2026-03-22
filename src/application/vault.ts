import type { OwnerContext } from "./identity.js";

export async function exportSecretPlaintext(context: OwnerContext, secretName: string): Promise<string | undefined> {
  try {
    const exported = await context.owner.exportSecret({ alias: secretName });
    return exported.plaintext;
  } catch {
    return undefined;
  }
}
