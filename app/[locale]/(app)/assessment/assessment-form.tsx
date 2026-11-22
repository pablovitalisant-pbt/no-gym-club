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
} from '@/lib/assessment/validate';

type Step = 'profile' | 'equipment' | 'health' | 'cardio' | 'parq';

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
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory | null>(null);

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

  const steps: Step[] = ['profile', 'equipment', 'health', 'cardio', 'parq'];

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

      {step === 'profile' && (
        <ProfileStep
          age={age} setAge={setAge}
          weight={weight} setWeight={setWeight}
          height={height} setHeight={setHeight}
          experience={experience} setExperience={setExperience}
          goal={goal} setGoal={setGoal}
          days={days} setDays={setDays}
          trainingHistory={trainingHistory} setTrainingHistory={setTrainingHistory}
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
