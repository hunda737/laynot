// Lets the server import the app's own TypeScript (the question bank, the daily-question
// picker, the leaderboard rules) so both always agree. Node strips the types by itself;
// this hook only teaches it two things the app's code relies on:
//   - the "@/..." alias, which points at app/src
//   - imports written without a file extension ("./difficulty", "./bank/books")
// Load it with: node --import ./src/register.js ...
import { existsSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP_SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'app', 'src');
const EXTENSIONS = ['.ts', '.tsx'];

function probe(base) {
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const ext of EXTENSIONS) if (existsSync(base + ext)) return base + ext;
  for (const ext of EXTENSIONS) if (existsSync(path.join(base, 'index' + ext))) return path.join(base, 'index' + ext);
  return null;
}

/** Only files inside app/src get this treatment; everything else resolves as usual. */
function inAppSrc(file) {
  const rel = path.relative(APP_SRC, file);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    let target = null;
    if (specifier.startsWith('@/')) {
      target = probe(path.join(APP_SRC, specifier.slice(2)));
    } else if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
      const parent = fileURLToPath(context.parentURL);
      if (inAppSrc(parent)) target = probe(path.resolve(path.dirname(parent), specifier));
    }
    if (target) return { url: pathToFileURL(target).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
