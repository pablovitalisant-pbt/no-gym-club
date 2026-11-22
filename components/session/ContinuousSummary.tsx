'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import type { FlatExercise } from '@/lib/session/flatten';
import { repsTargets, initialRepInputs, buildRepEntries } from '@/lib/session/continuous-view';
import { saveExerciseReps } from '@/app/[locale]/(session)/session/[id]/actions';
import { displayExerciseName } from '@/lib/exercises/display-name';

interface Props {
  sessionId: string;
  exercises: FlatExercise[];
  onDone: () => void;
}

/** Pantalla final del modo de corrido: reps opcionales y luego el LogForm de RPE. */
export default function ContinuousSummary({ sessionId, exercises, onDone }: Props) {
  const t = useTranslations('session');
  const targets = repsTargets(exercises);
  const [inputs, setInputs] = useState(() => initialRepInputs(targets));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const entries = buildRepEntries(targets, inputs);
    // Lista completa: mergeLogData reemplaza el ejercicio entero, nunca un delta.
    await saveExerciseReps(sessionId, entries).catch(() => {});
    setSaving(false);
    onDone();
  }

  return (
    <div className="flex-grow flex flex-col items-center text-center px-margin-mobile py-10 space-y-md">
      <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-green-500 uppercase">
        {t('summaryTitle')}
      </h2>
      <p className="font-body-md text-body-md text-on-surface-variant">{t('summaryIntro')}</p>

      <div className="w-full max-w-sm space-y-md">
        {targets.map((target) => (
          <div key={target.index} className="brutalist-border bg-surface-800 p-sm">
            <p className="font-label-bold text-label-sm uppercase text-on-surface mb-2">
              {displayExerciseName(target.exercise)}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {(inputs[target.index] ?? []).map((value, slot) => {
                const setN = target.bilateral ? Math.floor(slot / 2) + 1 : slot + 1;
                const sideN = target.bilateral ? (slot % 2 === 0 ? 1 : 2) : null;
                return (
                  <label key={slot} className="flex flex-col items-center gap-1 text-on-surface-variant">
                    <span className="font-label-sm text-label-sm">
                      {sideN ? `${t('side', { n: sideN })} · ` : ''}
                      {t('setLabel', { n: setN })}
                    </span>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          [target.index]: prev[target.index].map((v, j) =>
                            j === slot ? e.target.value : v,
                          ),
                        }))
                      }
                      className="w-20 bg-surface-900 brutalist-border border-2 border-outline text-center font-mono-data text-on-surface !py-2 focus:border-primary-container outline-none"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <Button onClick={handleSave} disabled={saving} className="w-full uppercase">
          {saving ? t('saving') : t('saveReps')}
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={saving} className="w-full uppercase">
          {t('omit')}
        </Button>
      </div>
    </div>
  );
}
