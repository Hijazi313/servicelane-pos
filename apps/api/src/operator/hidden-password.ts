import { emitKeypressEvents } from 'node:readline';
import type { ReadStream, WriteStream } from 'node:tty';

export function readHiddenPassword(input: ReadStream, output: WriteStream, prompt: string): Promise<string> {
  if (!input.isTTY || !output.isTTY) return Promise.reject(new Error('Password entry requires a terminal'));
  return new Promise((resolve, reject) => {
    const wasRaw = input.isRaw;
    // A fresh stdin has readableFlowing=null, not isPaused()=true.
    const wasFlowing = input.readableFlowing === true;
    let password = '';
    const cleanup = () => {
      input.removeListener('keypress', onKey);
      input.removeListener('end', onEnd);
      input.removeListener('error', onEnd);
      input.setRawMode(wasRaw);
      if (!wasFlowing) input.pause();
      output.write('\n');
    };
    const onEnd = () => { cleanup(); reject(new Error('Password entry cancelled')); };
    const onKey = (text: string | undefined, key: { name?: string; ctrl?: boolean; meta?: boolean }) => {
      if (key.ctrl && ['c', 'd'].includes(key.name ?? '')) return onEnd();
      if (key.name === 'return' || key.name === 'enter') { cleanup(); resolve(password); return; }
      if (key.name === 'backspace') { password = [...password].slice(0, -1).join(''); return; }
      if (key.ctrl && key.name === 'u') { password = ''; return; }
      if (!key.ctrl && !key.meta && text && !/[\p{Cc}]/u.test(text)) {
        if ([...password, ...text].length > 128) { cleanup(); reject(new Error('Password is too long')); return; }
        password += text;
      }
    };
    emitKeypressEvents(input);
    input.on('keypress', onKey);
    input.once('end', onEnd);
    input.once('error', onEnd);
    input.setRawMode(true);
    output.write(prompt);
    input.resume();
  });
}
