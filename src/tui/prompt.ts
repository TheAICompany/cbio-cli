/**
 * prompt.ts
 * Simple question helper for readline. Prompts with optional default, returns trimmed answer.
 */

import type * as readline from 'node:readline/promises';

export async function question(
    rl: readline.Interface,
    prompt: string,
    defaultValue?: string
): Promise<string> {
    const p = defaultValue !== undefined ? `${prompt} [${defaultValue}]: ` : `${prompt}: `;
    const ans = await rl.question(p);
    const v = ans.trim() || defaultValue;
    return (v !== undefined && v !== null ? v : '').trim();
}
