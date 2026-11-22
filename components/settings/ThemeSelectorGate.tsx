import { getFlag } from '@/lib/flags';
import ThemeSelector from './ThemeSelector';

export default function ThemeSelectorGate() {
  if (!getFlag('theme_switcher')) return null;
  return <ThemeSelector />;
}
