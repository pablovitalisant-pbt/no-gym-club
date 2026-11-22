import { getFlag } from '@/lib/flags';
import TopAppBar from './TopAppBar';

interface Props {
  items: { href: string; label: string }[];
  displayName?: string | null;
  avatarUrl?: string | null;
}

/** Envuelve la barra para no meter getFlag en el layout (que es shell compartido). */
export default function TopAppBarGate(props: Props) {
  return <TopAppBar {...props} showSettings={getFlag('profile_settings')} />;
}
