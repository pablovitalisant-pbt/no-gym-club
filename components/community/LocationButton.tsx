'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export default function LocationButton({
  onLocated,
}: {
  onLocated: (coords: { lat: number; lng: number }) => void;
}) {
  const t = useTranslations('community');
  const [state, setState] = useState<'idle' | 'loading' | 'denied' | 'ok'>('idle');

  function locate() {
    if (!navigator.geolocation) return setState('denied');
    setState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocated({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setState('ok');
      },
      () => setState('denied'),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-xs">
      <Button variant="secondary" onClick={locate} disabled={state === 'loading'}>
        {state === 'loading' ? t('locating') : t('useLocation')}
      </Button>
      {state === 'ok' && <p className="text-green-500 font-label-sm">{t('locationOk')}</p>}
      {state === 'denied' && <p className="text-on-surface-variant font-label-sm">{t('locationDenied')}</p>}
    </div>
  );
}
