import type { RunMode } from './continuous';

export const RUN_MODE_KEY = 'ngc-run-mode';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): StorageLike | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

/** Preferencia auto/manual del reproductor; cae en auto si no hay o no se puede leer. */
export function loadRunMode(storage: StorageLike | null = browserStorage()): RunMode {
  try {
    return storage?.getItem(RUN_MODE_KEY) === 'manual' ? 'manual' : 'auto';
  } catch {
    return 'auto';
  }
}

export function saveRunMode(mode: RunMode, storage: StorageLike | null = browserStorage()): void {
  try {
    storage?.setItem(RUN_MODE_KEY, mode);
  } catch {
    // Sin storage (modo privado): la sesión sigue con el modo en memoria.
  }
}
