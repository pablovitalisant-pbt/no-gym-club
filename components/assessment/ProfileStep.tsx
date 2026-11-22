import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import { TRAINING_HISTORY, type FocusArea, type TrainingHistory } from '@/lib/assessment/validate';
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
  onNext: () => void;
}

export function ProfileStep(p: Props) {
  const t = useTranslations('assessment');
  const inputCls = 'w-full bg-surface-900 brutalist-border brutalist-input p-4 text-on-surface font-mono-data text-body-md';
  const cardCls = 'brutalist-border p-4 bg-surface-800 peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all group-hover:bg-surface-700';

  return (
    <div className="space-y-lg">
      <header>
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 uppercase tracking-tight">
          {t('profile.title')}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">{t('profile.hint')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="space-y-xs">
          <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="age">{t('profile.age')}</label>
          <input id="age" type="number" min={14} max={100} required value={p.age} onChange={(e) => p.setAge(e.target.value)} className={inputCls} placeholder="25" />
        </div>
        <div className="space-y-xs">
          <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="weight">{t('profile.weight')}</label>
          <input id="weight" type="number" min={30} max={250} step="0.1" required value={p.weight} onChange={(e) => p.setWeight(e.target.value)} className={inputCls} placeholder="75" />
        </div>
        <div className="space-y-xs">
          <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="height">{t('profile.height')}</label>
          <input id="height" type="number" min={100} max={250} required value={p.height} onChange={(e) => p.setHeight(e.target.value)} className={inputCls} placeholder="180" />
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
                <p className="text-[10px] opacity-70 mt-1 uppercase">{t(`profile.${ex}Sub`)}</p>
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
                <p className="text-[10px] opacity-70 mt-1 uppercase">{t(`profile.${history}Sub`)}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-xs">
        <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="goal">{t('profile.goal')}</label>
        <select id="goal" value={p.goal} onChange={(e) => p.setGoal(e.target.value)} className={`${inputCls} uppercase tracking-wider`}>
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

      <div className="space-y-xs">
        <div className="flex justify-between items-center">
          <label className="font-label-bold text-label-sm uppercase text-on-surface-variant" htmlFor="days">{t('profile.days')}</label>
          <span className="font-mono-data text-primary text-body-lg">{p.days}</span>
        </div>
        <input id="days" type="range" min={1} max={7} value={p.days} onChange={(e) => p.setDays(e.target.value)} className="w-full h-1 bg-surface-800 appearance-none cursor-pointer accent-primary-container" />
        <div className="flex justify-between text-[10px] uppercase opacity-50 font-label-bold">
          <span>1</span>
          <span>7</span>
        </div>
      </div>

      <div className="pt-lg">
        <Button type="button" variant="primary" onClick={p.onNext} disabled={!p.age || !p.weight || !p.height || !p.trainingHistory} iconRight={ArrowRight} className="w-full uppercase !py-md">
          {t('next')}
        </Button>
      </div>
    </div>
  );
}
