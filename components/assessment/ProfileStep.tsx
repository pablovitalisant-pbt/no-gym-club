import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import { TRAINING_HISTORY, PROFILE_RANGES, inProfileRange, type FocusArea, type TrainingHistory } from '@/lib/assessment/validate';
import { FocusAreas } from './FocusAreas';

interface Props {
  age: string;
  setAge: (v: string) => void;
  weight: string;
  setWeight: (v: string) => void;
  height: string;
  setHeight: (v: string) => void;
  experience: string;
  setExperience: (v: string) => void;
  goal: string;
  setGoal: (v: string) => void;
  days: string;
  setDays: (v: string) => void;
  trainingHistory: TrainingHistory | null;
  setTrainingHistory: (v: TrainingHistory) => void;
  focusAreas: FocusArea[];
  setFocusAreas: (v: FocusArea[]) => void;
  focusNotes: string;
  setFocusNotes: (v: string) => void;
  displayName?: string;
  setDisplayName?: (v: string) => void;
  onNext: () => void;
}

export function ProfileStep(p: Props) {
  const t = useTranslations('assessment');
  const inputCls = 'w-full bg-surface-900 brutalist-border brutalist-input p-4 text-on-surface font-mono-data text-body-md';
  const cardCls = 'brutalist-border p-4 bg-surface-800 peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all group-hover:bg-surface-700';

  const rangeError = (field: keyof typeof PROFILE_RANGES, value: string) =>
    value !== '' && !inProfileRange(field, value)
      ? t('profile.outOfRange', PROFILE_RANGES[field])
      : null;
  const ageError = rangeError('age', p.age);
  const weightError = rangeError('weight_kg', p.weight);
  const heightError = rangeError('height_cm', p.height);
  const canContinue =
    inProfileRange('age', p.age) &&
    inProfileRange('weight_kg', p.weight) &&
    inProfileRange('height_cm', p.height) &&
    p.trainingHistory !== null;

  return (
    <div className="space-y-lg">
      <header>
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 uppercase tracking-tight">
          {t('profile.title')}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">{t('profile.hint')}</p>
      </header>

      <div className="space-y-xs">
        <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="display-name">
          {t('profile.displayName')}
        </label>
        <input
          id="display-name"
          type="text"
          maxLength={40}
          value={p.displayName ?? ''}
          onChange={(e) => p.setDisplayName?.(e.target.value)}
          className={inputCls}
          placeholder={t('profile.displayNamePlaceholder')}
        />
        <p className="text-label-sm text-on-surface-variant">{t('profile.displayNameHint')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="space-y-xs">
          <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="age">{t('profile.age')}</label>
          <input id="age" type="number" min={14} max={100} required value={p.age} onChange={(e) => p.setAge(e.target.value)} className={inputCls} placeholder="25" aria-invalid={!!ageError} />
          {ageError && <p className="text-error text-[10px] font-label-bold">{ageError}</p>}
        </div>
        <div className="space-y-xs">
          <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="weight">{t('profile.weight')}</label>
          <input id="weight" type="number" min={30} max={250} step="0.1" required value={p.weight} onChange={(e) => p.setWeight(e.target.value)} className={inputCls} placeholder="75" aria-invalid={!!weightError} />
          {weightError && <p className="text-error text-[10px] font-label-bold">{weightError}</p>}
        </div>
        <div className="space-y-xs">
          <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="height">{t('profile.height')}</label>
          <input id="height" type="number" min={100} max={250} required value={p.height} onChange={(e) => p.setHeight(e.target.value)} className={inputCls} placeholder="180" aria-invalid={!!heightError} />
          {heightError && <p className="text-error text-[10px] font-label-bold">{heightError}</p>}
        </div>
      </div>

      <div className="space-y-xs">
        <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block">{t('profile.experience')}</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
          {(['beginner', 'intermediate', 'advanced'] as const).map((ex) => (
            <label key={ex} className="relative cursor-pointer group">
              <input type="radio" name="experience" className="sr-only peer" checked={p.experience === ex} onChange={() => p.setExperience(ex)} />
              <div className={cardCls}>
                <span className="font-label-bold text-label-sm uppercase">{t(`profile.${ex}`)}</span>
                <p className="text-label-sm opacity-80 mt-1 normal-case">{t(`profile.${ex}Sub`)}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-xs">
        <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block">{t('profile.history')}</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
          {TRAINING_HISTORY.map((history) => (
            <label key={history} className="relative cursor-pointer group">
              <input type="radio" name="training_history" className="sr-only peer" checked={p.trainingHistory === history} onChange={() => p.setTrainingHistory(history)} />
              <div className={cardCls}>
                <span className="font-label-bold text-label-sm uppercase">{t(`profile.${history}`)}</span>
                <p className="text-label-sm opacity-80 mt-1 normal-case">{t(`profile.${history}Sub`)}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-xs">
        <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="goal">{t('profile.goal')}</label>
        <select id="goal" value={p.goal} onChange={(e) => p.setGoal(e.target.value)} className={inputCls}>
          {(['lose_weight', 'build_muscle', 'improve_endurance', 'master_skills', 'general_fitness'] as const).map((g) => (
            <option key={g} value={g}>{t(`profile.${g}`)}</option>
          ))}
        </select>
      </div>

      <FocusAreas
        value={p.focusAreas}
        onChange={p.setFocusAreas}
        notes={p.focusNotes}
        onNotesChange={p.setFocusNotes}
      />

      <div className="space-y-sm">
        <label className="font-body-md text-body-md text-on-surface block" id="days-label">{t('profile.days')}</label>
        <div role="group" aria-labelledby="days-label" className="grid grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => {
            const selected = p.days === String(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={selected}
                onClick={() => p.setDays(String(d))}
                className={`min-h-12 min-w-12 font-label-bold text-label-bold border-2 transition-colors ${selected ? 'bg-accent text-surface-900 border-accent' : 'border-text-primary text-text-primary hover:bg-surface-800'}`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-lg">
        <Button type="button" variant="primary" onClick={p.onNext} disabled={!canContinue} iconRight={ArrowRight} className="w-full">
          {t('next')}
        </Button>
      </div>
    </div>
  );
}
