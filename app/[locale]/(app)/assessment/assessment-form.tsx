'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { saveProfile } from './actions';
import { ArrowRight } from 'lucide-react';

type Step = 'profile' | 'equipment' | 'parq';

const EQUIPMENT_OPTIONS = [
  'bodyweight',
  'bar',
  'ground',
  'wall',
  'dumbbell',
] as const;

const PARQ_QUESTIONS = [
  'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7',
] as const;

export function AssessmentForm() {
  const t = useTranslations('assessment');
  const router = useRouter();

  const [step, setStep] = useState<Step>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // profile
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [experience, setExperience] = useState('beginner');
  const [goal, setGoal] = useState('general_fitness');
  const [days, setDays] = useState('3');

  // equipment
  const [equipment, setEquipment] = useState<string[]>(['bodyweight']);

  // PAR-Q
  const [parq, setParq] = useState<Record<string, boolean>>({});

  function toggleEquipment(eq: string) {
    setEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq],
    );
  }

  function allParqNo() {
    return PARQ_QUESTIONS.every((q) => !parq[q]);
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');

    const parqCleared = allParqNo();

    const result = await saveProfile({
      age: Number(age),
      weight_kg: Number(weight),
      height_cm: Number(height),
      experience_level: experience,
      primary_goal: goal,
      available_days_per_week: Number(days),
      available_equipment: equipment,
      par_q_cleared: parqCleared,
    });

    if (!result.success) {
      setError(result.error || 'Error saving profile');
      setLoading(false);
      return;
    }

    if (!result.par_q_cleared) {
      router.push('/dashboard?parq=blocked');
    } else {
      router.push('/dashboard?assessment=done');
    }
  }

  const steps: Step[] = ['profile', 'equipment', 'parq'];
  const inputCls = 'w-full bg-surface-900 brutalist-border brutalist-input p-4 text-on-surface font-mono-data text-body-md';

  return (
    <div className="mx-auto max-w-lg">
      {/* Step indicator */}
      <nav className="mb-lg border-b border-outline flex justify-between items-end">
        {steps.map((s, i) => {
          const isActive = s === step;
          return (
            <div
              key={s}
              className={`flex-1 pb-2 ${isActive ? 'border-b-2 border-primary-container' : 'border-b-2 border-outline'} ${i === 0 ? 'text-left' : i === steps.length - 1 ? 'text-right' : 'text-center'}`}
            >
              <span className={`font-label-bold text-label-sm uppercase ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                {i + 1}. {t(`${s}.title`)}
              </span>
            </div>
          );
        })}
      </nav>

      {/* Step 1: Profile */}
      {step === 'profile' && (
        <div className="space-y-lg">
          <header>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 uppercase tracking-tight">
              {t('profile.title')}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t('profile.hint')}
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="space-y-xs">
              <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="age">{t('profile.age')}</label>
              <input id="age" type="number" min={14} max={100} required value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} placeholder="25" />
            </div>
            <div className="space-y-xs">
              <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="weight">{t('profile.weight')}</label>
              <input id="weight" type="number" min={30} max={250} step="0.1" required value={weight} onChange={(e) => setWeight(e.target.value)} className={inputCls} placeholder="75" />
            </div>
            <div className="space-y-xs">
              <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="height">{t('profile.height')}</label>
              <input id="height" type="number" min={100} max={250} required value={height} onChange={(e) => setHeight(e.target.value)} className={inputCls} placeholder="180" />
            </div>
          </div>

          <div className="space-y-xs">
            <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block">{t('profile.experience')}</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
              {(['beginner', 'intermediate', 'advanced'] as const).map((ex) => (
                <label key={ex} className="relative cursor-pointer group">
                  <input type="radio" name="experience" className="sr-only peer" checked={experience === ex} onChange={() => setExperience(ex)} />
                  <div className="brutalist-border p-4 bg-surface-800 peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all group-hover:bg-surface-700">
                    <span className="font-label-bold text-label-sm uppercase">{t(`profile.${ex}`)}</span>
                    <p className="text-[10px] opacity-70 mt-1 uppercase">{t(`profile.${ex}Sub`)}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-xs">
            <label className="font-label-bold text-label-sm uppercase text-on-surface-variant block" htmlFor="goal">{t('profile.goal')}</label>
            <select id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} className={`${inputCls} uppercase tracking-wider`}>
              {(['lose_weight', 'build_muscle', 'improve_endurance', 'master_skills', 'general_fitness'] as const).map((g) => (
                <option key={g} value={g}>{t(`profile.${g}`)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-xs">
            <div className="flex justify-between items-center">
              <label className="font-label-bold text-label-sm uppercase text-on-surface-variant" htmlFor="days">{t('profile.days')}</label>
              <span className="font-mono-data text-primary text-body-lg">{days}</span>
            </div>
            <input id="days" type="range" min={1} max={7} value={days} onChange={(e) => setDays(e.target.value)} className="w-full h-1 bg-surface-800 appearance-none cursor-pointer accent-primary-container" />
            <div className="flex justify-between text-[10px] uppercase opacity-50 font-label-bold">
              <span>1</span>
              <span>7</span>
            </div>
          </div>

          <div className="pt-lg">
            <Button type="button" variant="primary" onClick={() => setStep('equipment')} disabled={!age || !weight || !height} iconRight={ArrowRight} className="w-full uppercase !py-md">
              {t('next')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Equipment — Spec del Director Técnico */}
      {step === 'equipment' && (
        <div className="space-y-lg">
          <header>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 uppercase tracking-tight">
              {t('equipment.title')}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('equipment.hint')}</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
            {EQUIPMENT_OPTIONS.map((eq) => (
              <label key={eq} className="relative cursor-pointer group">
                <input type="checkbox" className="sr-only peer" checked={equipment.includes(eq)} onChange={() => toggleEquipment(eq)} />
                <div className="brutalist-border p-4 bg-surface-800 peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all group-hover:bg-surface-700">
                  <span className="font-label-bold text-label-sm uppercase">{t(`equipment.${eq}`)}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-between pt-lg">
            <Button type="button" variant="ghost" onClick={() => setStep('profile')}>{t('back')}</Button>
            <Button type="button" variant="primary" onClick={() => setStep('parq')} disabled={equipment.length === 0} iconRight={ArrowRight} className="!py-md">{t('next')}</Button>
          </div>
        </div>
      )}

      {/* Step 3: PAR-Q — Spec del Director Técnico */}
      {step === 'parq' && (
        <div className="space-y-lg">
          <header>
            <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2 uppercase tracking-tight">
              {t('parq.title')}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('parq.description')}</p>
          </header>

          {PARQ_QUESTIONS.map((q) => (
            <div key={q} className="brutalist-border p-4 bg-surface-800 space-y-sm">
              <p className="font-body-md text-on-surface">{t(`parq.${q}`)}</p>
              <div className="grid grid-cols-2 gap-base">
                <label className="relative cursor-pointer group">
                  <input type="radio" name={q} className="sr-only peer" checked={parq[q] === true} onChange={() => setParq((prev) => ({ ...prev, [q]: true }))} />
                  <div className="brutalist-border p-3 text-center peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all">
                    <span className="font-label-bold text-label-sm uppercase">{t('parq.yes')}</span>
                  </div>
                </label>
                <label className="relative cursor-pointer group">
                  <input type="radio" name={q} className="sr-only peer" checked={parq[q] === false} onChange={() => setParq((prev) => ({ ...prev, [q]: false }))} />
                  <div className="brutalist-border p-3 text-center peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all">
                    <span className="font-label-bold text-label-sm uppercase">{t('parq.no')}</span>
                  </div>
                </label>
              </div>
            </div>
          ))}

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="flex justify-between pt-lg">
            <Button type="button" variant="ghost" onClick={() => setStep('equipment')}>{t('back')}</Button>
            <Button type="button" variant="primary" onClick={handleSubmit} disabled={loading || PARQ_QUESTIONS.some((q) => parq[q] === undefined)} className="!py-md">
              {loading ? '...' : t('submit')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
