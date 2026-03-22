import type { AgentCapability, AuditEntry } from "@the-ai-company/cbio-node-runtime";
import type { OwnerContext } from "./identity.js";
import { exportSecretPlaintext } from "./vault.js";

export type OwnerVaultSummary = {
  vaultId: string;
  ownerId: string;
  agentId: string;
  publicKey: string;
  vaultDir: string;
  secretCount: number;
  agentCount: number;
  capabilityCount: number;
  auditCount: number;
};

export type RegisteredAgentSummary = {
  agentId: string;
  detail: string;
  occurredAt: string;
};

export type RegisteredCapabilitySummary = {
  capabilityId: string;
  operation: string;
  detail: string;
  occurredAt: string;
};

function parseRegisteredAgentId(entry: AuditEntry): string | null {
  if (entry.action !== "register_agent_identity" || entry.outcome !== "succeeded") {
    return null;
  }

  const match = entry.detail.match(/^agent identity registered: (.+)$/);
  return match?.[1]?.trim() || null;
}

function parseRegisteredCapabilityId(entry: AuditEntry): string | null {
  if (entry.action !== "register_capability" || entry.outcome !== "succeeded") {
    return null;
  }

  return entry.capabilityId || entry.detail.match(/^capability registered: (.+)$/)?.[1]?.trim() || null;
}

export async function getOwnerAudit(context: OwnerContext): Promise<AuditEntry[]> {
  const entries = await context.owner.readAudit();
  return [...entries];
}

export async function listSecretAliases(context: OwnerContext): Promise<string[]> {
  const entries = await getOwnerAudit(context);
  return Array.from(new Set(
    entries
      .filter((entry) => entry.action === "write_secret" && entry.outcome === "succeeded" && entry.secretAlias)
      .map((entry) => entry.secretAlias as string)
  )).sort();
}

export async function listRegisteredAgents(context: OwnerContext): Promise<RegisteredAgentSummary[]> {
  const entries = await getOwnerAudit(context);
  const byId = new Map<string, RegisteredAgentSummary>();

  for (const entry of entries) {
    const agentId = parseRegisteredAgentId(entry);
    if (!agentId) continue;
    byId.set(agentId, {
      agentId,
      detail: entry.detail,
      occurredAt: entry.occurredAt,
    });
  }

  return [...byId.values()].sort((a, b) => a.agentId.localeCompare(b.agentId));
}

export async function listRegisteredCapabilities(context: OwnerContext): Promise<RegisteredCapabilitySummary[]> {
  const entries = await getOwnerAudit(context);
  const byId = new Map<string, RegisteredCapabilitySummary>();

  for (const entry of entries) {
    const capabilityId = parseRegisteredCapabilityId(entry);
    if (!capabilityId) continue;
    byId.set(capabilityId, {
      capabilityId,
      operation: entry.operation || "unknown",
      detail: entry.detail,
      occurredAt: entry.occurredAt,
    });
  }

  return [...byId.values()].sort((a, b) => a.capabilityId.localeCompare(b.capabilityId));
}

export async function summarizeOwnerContext(context: OwnerContext): Promise<OwnerVaultSummary> {
  const [audit, secrets, agents, capabilities] = await Promise.all([
    getOwnerAudit(context),
    listSecretAliases(context),
    listRegisteredAgents(context),
    listRegisteredCapabilities(context),
  ]);

  return {
    vaultId: context.vaultId,
    ownerId: context.ownerId,
    agentId: context.agentId,
    publicKey: context.publicKey,
    vaultDir: context.vaultDir,
    secretCount: secrets.length,
    agentCount: agents.length,
    capabilityCount: capabilities.length,
    auditCount: audit.length,
  };
}

export async function getSecretValue(context: OwnerContext, secretName: string): Promise<string | undefined> {
  return exportSecretPlaintext(context, secretName);
}

export async function addSecretIfMissing(
  context: OwnerContext,
  secretName: string,
  secretValue: string,
  targetUrl: string,
  method?: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const names = await listSecretAliases(context);
  if (names.includes(secretName)) {
    return { ok: false, message: `Secret "${secretName}" already exists.` };
  }

  const url = new URL(targetUrl);
  await context.owner.writeSecret({
    alias: secretName,
    plaintext: secretValue,
    targetBindings: [{
      kind: "site",
      targetId: url.hostname,
      targetUrl: url.toString(),
      methods: method ? [method.toUpperCase()] : undefined,
      paths: [url.pathname || "/"],
    }],
  });
  return { ok: true };
}

export async function registerAgent(
  context: OwnerContext,
  agentId: string,
  publicKey: string
): Promise<void> {
  await context.owner.registerAgent({ agentId, publicKey });
}

export async function registerDispatchCapability(
  context: OwnerContext,
  input: {
    capabilityId: string;
    agentId: string;
    secretAlias: string;
    targetUrl: string;
    method: string;
    expiresAt?: string;
  }
): Promise<void> {
  const target = new URL(input.targetUrl);
  const capability: AgentCapability = {
    vaultId: { value: context.vaultId },
    capabilityId: input.capabilityId,
    agentId: input.agentId,
    secretAliases: [input.secretAlias],
    operation: "dispatch_http",
    allowedTargets: [target.toString()],
    allowedMethods: [input.method.toUpperCase()],
    allowedPaths: [target.pathname || "/"],
    issuedAt: new Date().toISOString(),
    expiresAt: input.expiresAt || undefined,
    auditRequired: true,
  };

  await context.owner.grantCapability({ capability });
}

export async function getActivitySummary(context: OwnerContext): Promise<{ recentEntries: AuditEntry[]; actorId: string }> {
  const entries = await getOwnerAudit(context);
  return {
    recentEntries: entries.slice(-30).reverse(),
    actorId: context.ownerId,
  };
}
