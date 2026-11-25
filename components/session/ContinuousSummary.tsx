'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { FlatExercise } from '@/lib/session/flatten';
import {
  repsTargets,
  buildRepEntries,
  inputsFrom,
} from '@/lib/session/continuous-view';
import { saveExerciseReps } from '@/app/[locale]/(session)/session/[id]/actions';
import { displayExerciseName } from '@/lib/exercises/display-name';
import { greetingText } from '@/lib/settings/greeting';

interface Props {
  sessionId: string;
  exercises: FlatExercise[];
  onDone: () => void;
  displayName?: string | null;
  /** Reps registradas durante el corrido, para prellenar las cajas. */
  recorded?: Record<string, string> | null;
}

/** Cierre del modo de corrido: reps por serie editables y luego el RPE. */
export default function ContinuousSummary({
  sessionId,
  exercises,
  onDone,
  displayName = null,
  recorded = null,
}: Props) {
  const t = useTranslations('session');
  const targets = repsTargets(exercises);
  const [inputs, setInputs] = useState(() => inputsFrom(targets, recorded));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaveError(false);
    const entries = buildRepEntries(targets, inputs);
    // Lista completa: mergeLogData reemplaza el ejercicio entero, nunca un delta.
    try {
      const res = await saveExerciseReps(sessionId, entries);
      if (!res.success) {
        setSaveError(true);
        return; // conserva los inputs para reintentar
      }
      setSaved(true);
      setTimeout(onDone, 1500);
    } catch {
      setSaveError(true); // red caida: la action rechaza; permite reintentar
    } finally {
      setSaving(false);
    }
  }

  const greeting = greetingText(t.raw('summaryGreeting'), displayName);

  return (
    <div className="flex-grow flex flex-col px-margin-mobile py-8 space-y-md text-on-surface bg-background">
      <h2 className="text-3xl font-bold break-words text-on-surface">{t('summaryTitle')}</h2>
      {greeting && <p className="text-lg text-on-surface">{greeting}</p>}
      <p className="text-base text-on-surface">{t('summaryIntro')}</p>

      <div className="w-full max-w-sm mx-auto space-y-md">
        {targets.map((target) => (
          <div key={target.index} className="border-2 border-outline-variant bg-card rounded-xl p-4">
            <p className="text-xl font-bold text-on-surface">{displayExerciseName(target.exercise)}</p>
            <p className="font-mono text-base text-on-surface mb-3">
              {target.sets} x {target.reps}
            </p>
            <div className="flex flex-wrap gap-2">
              {(inputs[target.index] ?? []).map((value, slot) => {
                const setN = target.bilateral ? Math.floor(slot / 2) + 1 : slot + 1;
                const sideN = target.bilateral ? (slot % 2 === 0 ? 1 : 2) : null;
                return (
                  <label key={slot} className="flex flex-col items-center gap-1">
                    <span className="text-sm font-bold text-on-surface">
                      S{setN}
                      {sideN ? `·${sideN}` : ''}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      value={value}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          [target.index]: prev[target.index].map((v, j) =>
                            j === slot ? e.target.value : v,
                          ),
                        }))
                      }
                      className="min-w-[64px] min-h-[56px] w-[64px] border-2 border-outline-variant bg-surface-900 text-center text-[22px] font-bold text-on-surface outline-none focus:border-control-bg"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {saveError && (
        <p role="alert" className="text-base font-bold text-error text-center">
          {t('summarySaveError')}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || saved}
        className="w-full max-w-sm mx-auto min-h-[56px] border-2 border-control-bg bg-control-bg text-control-fg text-lg font-bold uppercase disabled:opacity-70"
      >
        {saving ? t('saving') : saved ? t('summarySaved') : t('summarySave')}
      </button>
    </div>
  );
}
