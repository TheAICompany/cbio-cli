/**
 * readSecret - Reads password with no echo. Uses stty -echo on Unix.
 * Single responsibility: secure terminal input for sensitive data.
 */

import { execSync } from 'node:child_process';

export function readSecretNoEcho(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        const isUnix = process.platform !== 'win32' && process.stdin.isTTY;
        const cleanup = () => {
            if (isUnix) {
                try { execSync('stty echo', { stdio: 'inherit' }); } catch { /* ignore */ }
            }
            process.stdin.setRawMode(false);
            process.stdin.pause();
        };
        const onSigInt = () => { cleanup(); process.exit(130); };
        process.stdout.write(prompt);
        let buf = '';
        process.stdin.setRawMode(true);
        process.stdin.resume();
        if (isUnix) {
            try { execSync('stty -echo', { stdio: 'inherit' }); } catch { /* ignore */ }
        }
        process.once('SIGINT', onSigInt);
        process.stdin.setEncoding('utf8');
        const onData = (chunk: string) => {
            if (chunk === '\r' || chunk === '\n') {
                process.stdin.off('data', onData);
                process.off('SIGINT', onSigInt);
                cleanup();
                process.stdout.write('\n');
                resolve(buf);
                return;
            }
            if (chunk.charCodeAt(0) === 3) {
                process.off('SIGINT', onSigInt);
                cleanup();
                process.exit(130);
            }
            const wasEmpty = buf.length === 0;
            buf += chunk;
            if (wasEmpty) process.stdout.write('******');
        };
        process.stdin.on('data', onData);
    });
}
