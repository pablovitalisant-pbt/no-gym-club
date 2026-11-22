'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { saveProfile } from './actions';
import { ProfileStep } from '@/components/assessment/ProfileStep';
import { EquipmentStep } from '@/components/assessment/EquipmentStep';
import { HealthStep } from '@/components/assessment/HealthStep';
import { CardioStep } from '@/components/assessment/CardioStep';
import { ParqStep } from '@/components/assessment/ParqStep';
import type {
  TrainingHistory,
  HealthLimitation,
  CardioPreference,
  FocusArea,
} from '@/lib/assessment/validate';

type Step = 'profile' | 'equipment' | 'health' | 'cardio' | 'parq';

export function AssessmentForm({ stepIndicator = true }: { stepIndicator?: boolean }) {
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
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory | null>(null);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [focusNotes, setFocusNotes] = useState('');

  // equipment
  const [equipment, setEquipment] = useState<string[]>(['bodyweight']);

  // health
  const [limitations, setLimitations] = useState<HealthLimitation[]>([]);
  const [limitationsNotes, setLimitationsNotes] = useState('');

  // cardio
  const [cardio, setCardio] = useState<CardioPreference>('none');

  // PAR-Q
  const [parq, setParq] = useState<Record<string, boolean>>({});

  function toggleEquipment(eq: string) {
    setEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq],
    );
  }

  function toggleLimitation(limitation: HealthLimitation) {
    setLimitations((prev) =>
      prev.includes(limitation) ? prev.filter((l) => l !== limitation) : [...prev, limitation],
    );
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');

    const parqCleared = Object.values(parq).every((v) => !v);

    const result = await saveProfile({
      age: Number(age),
      weight_kg: Number(weight),
      height_cm: Number(height),
      experience_level: experience,
      primary_goal: goal,
      available_days_per_week: Number(days),
      available_equipment: equipment,
      par_q_cleared: parqCleared,
      training_history: trainingHistory,
      health_limitations: limitations,
      limitations_notes: limitationsNotes.trim() || null,
      cardio_preference: cardio,
      focus_areas: focusAreas,
      focus_notes: focusNotes.trim() || null,
    });

    if (!result.success) {
      setError(result.error || 'Error saving profile');
      setLoading(false);
      return;
    }

    if (!result.par_q_cleared) {
      router.push('/dashboard?parq=blocked');
    } else {
      router.push('/assessment/test');
    }
  }

  const steps: Step[] = ['profile', 'equipment', 'health', 'cardio', 'parq'];

  return (
    <div className="mx-auto max-w-lg">
      {/* Step indicator: Paso N de 5 + nombre + barra segmentada */}
      {stepIndicator ? (
        <nav className="mb-lg space-y-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-label-bold text-label-bold text-primary">
              {t('stepOf', { current: steps.indexOf(step) + 1, total: steps.length })}
            </span>
            <span className="font-body-md text-body-md text-on-surface text-right">
              {t(`${step}.title`)}
            </span>
          </div>
          <div className="flex gap-1" aria-hidden="true">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`h-2 flex-1 ${i <= steps.indexOf(step) ? 'bg-accent' : 'bg-outline'}`}
              />
            ))}
          </div>
        </nav>
      ) : (
        <nav className="mb-lg border-b border-outline flex justify-between items-end">
          {steps.map((s, i) => (
            <div key={s} className={`flex-1 pb-2 ${s === step ? 'border-b-2 border-primary-container' : 'border-b-2 border-outline'}`}>
              <span className="font-label-bold text-label-sm text-on-surface-variant">
                {i + 1}. {t(`${s}.title`)}
              </span>
            </div>
          ))}
        </nav>
      )}

      {step === 'profile' && (
        <ProfileStep
          age={age} setAge={setAge}
          weight={weight} setWeight={setWeight}
          height={height} setHeight={setHeight}
          experience={experience} setExperience={setExperience}
          goal={goal} setGoal={setGoal}
          days={days} setDays={setDays}
          trainingHistory={trainingHistory} setTrainingHistory={setTrainingHistory}
          focusAreas={focusAreas} setFocusAreas={setFocusAreas}
          focusNotes={focusNotes} setFocusNotes={setFocusNotes}
          onNext={() => setStep('equipment')}
        />
      )}

      {step === 'equipment' && (
        <EquipmentStep
          equipment={equipment}
          onToggle={toggleEquipment}
          onBack={() => setStep('profile')}
          onNext={() => setStep('health')}
        />
      )}

      {step === 'health' && (
        <HealthStep
          limitations={limitations}
          onToggle={toggleLimitation}
          notes={limitationsNotes}
          onNotesChange={setLimitationsNotes}
          onBack={() => setStep('equipment')}
          onNext={() => setStep('cardio')}
        />
      )}

      {step === 'cardio' && (
        <CardioStep
          value={cardio}
          onChange={setCardio}
          onBack={() => setStep('health')}
          onNext={() => setStep('parq')}
        />
      )}

      {step === 'parq' && (
        <ParqStep
          parq={parq}
          setParq={setParq}
          error={error}
          loading={loading}
          onBack={() => setStep('cardio')}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
