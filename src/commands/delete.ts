import process from "node:process";

export async function runDeleteCommand(_secretName?: string): Promise<void> {
  console.error("Delete is not available in the runtime 1.13 public API.");
  process.exit(1);
}
