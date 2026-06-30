'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { saveProfile } from './actions';

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

  return (
    <div className="mx-auto max-w-lg">
      {/* Step indicator */}
      <div className="mb-8 flex gap-2 text-xs text-text-muted">
        {(['profile', 'equipment', 'parq'] as Step[]).map((s, i) => (
          <span
            key={s}
            className={s === step ? 'text-accent' : ''}
          >
            {i + 1}. {t(`${s}.title`)}
            {i < 2 && ' → '}
          </span>
        ))}
      </div>

      {/* Step 1: Profile */}
      {step === 'profile' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">
            {t('profile.title')}
          </h2>

          <div>
            <label className="text-sm text-text-muted">{t('profile.age')}</label>
            <input
              type="number"
              min={10}
              max={100}
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="mt-1 w-full border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-sm text-text-muted">{t('profile.weight')}</label>
            <input
              type="number"
              min={30}
              max={250}
              step="0.1"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 w-full border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-sm text-text-muted">{t('profile.height')}</label>
            <input
              type="number"
              min={100}
              max={250}
              step="0.1"
              required
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="mt-1 w-full border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="text-sm text-text-muted">{t('profile.experience')}</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="mt-1 w-full border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            >
              <option value="beginner">{t('profile.beginner')}</option>
              <option value="intermediate">{t('profile.intermediate')}</option>
              <option value="advanced">{t('profile.advanced')}</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-text-muted">{t('profile.goal')}</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="mt-1 w-full border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            >
              <option value="lose_weight">{t('profile.lose_weight')}</option>
              <option value="build_muscle">{t('profile.build_muscle')}</option>
              <option value="improve_endurance">{t('profile.improve_endurance')}</option>
              <option value="master_skills">{t('profile.master_skills')}</option>
              <option value="general_fitness">{t('profile.general_fitness')}</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-text-muted">{t('profile.days')}</label>
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="mt-1 w-full border border-border bg-surface-900 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              onClick={() => setStep('equipment')}
              disabled={!age || !weight || !height}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Equipment */}
      {step === 'equipment' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">
            {t('equipment.title')}
          </h2>

          <p className="text-sm text-text-muted">{t('equipment.hint')}</p>

          {EQUIPMENT_OPTIONS.map((eq) => (
            <label
              key={eq}
              className="flex items-center gap-3 border border-border p-3 text-sm text-text-primary"
            >
              <input
                type="checkbox"
                checked={equipment.includes(eq)}
                onChange={() => toggleEquipment(eq)}
                className="accent-accent"
              />
              {t(`equipment.${eq}`)}
            </label>
          ))}

          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep('profile')}>
              {t('back')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setStep('parq')}
              disabled={equipment.length === 0}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: PAR-Q */}
      {step === 'parq' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">
            {t('parq.title')}
          </h2>

          <p className="text-sm text-text-muted">{t('parq.description')}</p>

          {PARQ_QUESTIONS.map((q) => (
            <div key={q} className="border border-border p-3">
              <p className="text-sm text-text-primary">{t(`parq.${q}`)}</p>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-1 text-sm text-text-muted">
                  <input
                    type="radio"
                    name={q}
                    checked={parq[q] === true}
                    onChange={() => setParq((prev) => ({ ...prev, [q]: true }))}
                    className="accent-accent"
                  />
                  {t('parq.yes')}
                </label>
                <label className="flex items-center gap-1 text-sm text-text-muted">
                  <input
                    type="radio"
                    name={q}
                    checked={parq[q] === false}
                    onChange={() => setParq((prev) => ({ ...prev, [q]: false }))}
                    className="accent-accent"
                  />
                  {t('parq.no')}
                </label>
              </div>
            </div>
          ))}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep('equipment')}>
              {t('back')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={loading || PARQ_QUESTIONS.some((q) => parq[q] === undefined)}
            >
              {loading ? '...' : t('submit')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
