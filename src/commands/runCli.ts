import process from "node:process";
import { runAgentIdCommand } from "./agentId.js";
import { runDeleteCommand } from "./delete.js";
import { runGetCommand } from "./get.js";
import { runInitCommand } from "./init.js";
import { runProxyCommand } from "./proxy.js";
import { runTui } from "../ui/tui/index.js";

function printUsage(): void {
  console.log("Usage:");
  console.log("");
  console.log("Core Commands:");
  console.log("  cbio init                   Create a new identity");
  console.log("  cbio tui                    Manage secrets in the local vault");
  console.log("  cbio proxy <upstream-url> [secret-name]");
  console.log("                              Start a local auth proxy");
  console.log("");
  console.log("Advanced Commands:");
  console.log("  cbio agent-id               Print the root agent ID for a private key");
  console.log("  cbio get <secret-name>      Print a secret in plaintext");
  console.log("  cbio delete <secret-name>   Delete a secret after confirmation");
}

export async function runCli(argv = process.argv): Promise<void> {
  const cmd = argv[2];
  const arg1 = argv[3];
  const arg2 = argv[4];

  if (cmd === "tui") {
    await runTui();
    return;
  }

  if (cmd === "proxy" && arg1) {
    await runProxyCommand(arg1, arg2);
    return;
  }

  if (cmd === "agent-id") {
    await runAgentIdCommand();
    return;
  }

  if (cmd === "init") {
    await runInitCommand();
    return;
  }

  if (cmd === "get" && arg1) {
    await runGetCommand(arg1);
    return;
  }

  if (cmd === "delete" && arg1) {
    await runDeleteCommand(arg1);
    return;
  }

  printUsage();
}
