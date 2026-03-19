/**
 * selectFromMenu.ts
 * Arrow-key menu. Item 0 is always Quit/Back. Returns selected index (0-based).
 */

export function selectFromMenu(headerLines: string[], items: string[]): Promise<number> {
    return new Promise((resolve) => {
        if (!process.stdin.isTTY) {
            process.stdout.write(headerLines.join('\n') + '\n' + items.join('\n') + '\n');
            resolve(0);
            return;
        }
        const HINT = '[↑↓/0-9 select, Enter confirm]';
        const SEPARATOR = '──────────';
        let idx = 0;
        let escBuf = '';

        process.stdout.write('\x1b[2J\x1b[H');

        const REV_ON = '\x1b[7m';
        const REV_OFF = '\x1b[27m';
        const wrapInBox = (lines: string[], highlightLineIdx: number): string[] => {
            const innerWidth = Math.min(
                Math.max(48, ...lines.map((l) => l.length)),
                (process.stdout.columns || 80) - 4
            );
            const pad = (s: string) => {
                const t = s.length > innerWidth ? s.slice(0, innerWidth - 3) + '...' : s;
                return t.padEnd(innerWidth);
            };
            const top = '╭' + '─'.repeat(innerWidth + 2) + '╮';
            const bot = '╰' + '─'.repeat(innerWidth + 2) + '╯';
            return [
                top,
                ...lines.map((l, i) => {
                    const cell = pad(l);
                    return '│ ' + (i === highlightLineIdx ? REV_ON + cell + REV_OFF : cell) + ' │';
                }),
                bot,
            ];
        };

        const render = () => {
            const lines = [...headerLines, SEPARATOR];
            items.forEach((item, i) => {
                lines.push((i === idx ? '> ' : '  ') + item);
            });
            lines.push('');
            lines.push(HINT);
            const highlightLineIdx = headerLines.length + 1 + idx;
            const boxed = wrapInBox(lines, highlightLineIdx);
            process.stdout.write('\x1b[2J\x1b[H' + boxed.join('\n') + '\n');
        };

        render();

        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');

        const cleanup = () => {
            process.stdin.setRawMode(false);
            process.stdin.resume();
            process.stdin.off('data', onData);
        };

        const onData = (chunk: string) => {
            escBuf += chunk;
            if (escBuf.endsWith('\r') || escBuf.endsWith('\n')) {
                cleanup();
                process.stdout.write('\n');
                resolve(idx);
                return;
            }
            if (escBuf === '\x1b') return;
            if (escBuf === '\x1b[') return;
            if (escBuf === '\x1b[A') {
                idx = (idx - 1 + items.length) % items.length;
                escBuf = '';
                render();
                return;
            }
            if (escBuf === '\x1b[B') {
                idx = (idx + 1) % items.length;
                escBuf = '';
                render();
                return;
            }
            if (escBuf.charCodeAt(escBuf.length - 1) === 3) {
                cleanup();
                process.exit(130);
            }
            if (escBuf.length === 1 && escBuf >= '0' && escBuf <= '9') {
                const n = parseInt(escBuf, 10);
                idx = Math.min(n, items.length - 1);
                escBuf = '';
                render();
                return;
            }
            escBuf = '';
        };
        process.stdin.on('data', onData);
    });
}
