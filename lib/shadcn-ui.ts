import { getFlag } from '@/lib/flags';

// Base shadcn/ui instalada sin pantallas; el flag se activa al migrar Button (Bug #12).
export const shadcnUiEnabled = (): boolean => getFlag('shadcn_ui');
