-- Seed: corpus de ciencia del deporte (50 documentos)
-- Embeddings generados via NVIDIA NIM nv-embedqa-e5-v5 (1024 dims)
-- Insertar con: npx tsx scripts/seed-corpus.ts

-- ============================================================================
-- PROGRESSIVE OVERLOAD (8)
-- ============================================================================

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Principio de sobrecarga progresiva',
  'La sobrecarga progresiva es el principio fundamental del entrenamiento de fuerza y resistencia. Establece que para que un tejido biológico (músculo, hueso, tendón) se adapte y mejore su capacidad, debe ser expuesto a un estrés mayor al que está acostumbrado. Este principio fue formulado por el Dr. Thomas DeLorme después de la Segunda Guerra Mundial durante sus estudios de rehabilitación con soldados. La sobrecarga puede aplicarse aumentando la carga (peso), el volumen (series x repeticiones), la frecuencia (sesiones por semana), la densidad (menos descanso entre series), o la dificultad del ejercicio (progresiones). La clave es que el incremento debe ser gradual: aumentos del 2-5% semanales en carga son seguros para principiantes, mientras que atletas avanzados pueden necesitar microciclos de 3-4 semanas para observar adaptaciones significativas. La falta de sobrecarga resulta en estancamiento; el exceso resulta en sobreentrenamiento o lesión.',
  'progressive_overload',
  ARRAY['sobrecarga', 'adaptacion', 'principio fundamental', 'DeLorme', 'progresion']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Volumen de entrenamiento semanal por grupo muscular',
  'El volumen de entrenamiento se define como el número total de series efectivas realizadas por grupo muscular por semana. La literatura científica actual, basada en meta-análisis de Schoenfeld et al. (2017), establece rangos de volumen óptimos: 10-20 series semanales por grupo muscular para hipertrofia en individuos entrenados. Principiantes pueden obtener ganancias significativas con tan solo 6-10 series semanales. El volumen tiene una relación dosis-respuesta con la hipertrofia hasta aproximadamente 20 series semanales, después de lo cual hay rendimientos decrecientes y mayor riesgo de sobreentrenamiento. La distribución del volumen en 2-3 sesiones semanales es superior a concentrarlo en una sola sesión (efecto de frecuencia). Para entrenamiento con peso corporal, una serie se define como un set llevado cerca del fallo (RIR 1-3), no necesariamente al fallo absoluto.',
  'progressive_overload',
  ARRAY['volumen', 'series', 'hipertrofia', 'Schoenfeld', 'dosis-respuesta']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Intensidad relativa y repeticiones en reserva (RIR)',
  'La intensidad relativa mide qué tan cerca del fallo muscular se realiza una serie. El concepto de Repeticiones en Reserva (RIR) cuantifica esto: RIR 2 significa que el ejecutante podría haber hecho 2 repeticiones más con buena técnica. Estudios de Helms et al. (2016) muestran que entrenar consistentemente a RIR 2-3 produce hipertrofia similar a entrenar al fallo (RIR 0), con menor fatiga sistémica y mejor recuperación. El fallo absoluto debe usarse con moderación — típicamente solo en la última serie de un ejercicio, o en ejercicios de bajo riesgo (empujes en máquina, no sentadillas pesadas). Para principiantes, RIR 3-4 es suficiente para generar adaptación mientras se aprende la técnica correcta. La intensidad también puede medirse como porcentaje de 1RM, pero este método es menos preciso en ejercicios con peso corporal donde el 1RM es difícil de determinar.',
  'progressive_overload',
  ARRAY['intensidad', 'RIR', 'fallo muscular', 'Helms', 'recuperacion']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Frecuencia de entrenamiento óptima',
  'La frecuencia de entrenamiento se refiere a cuántas veces por semana se entrena un grupo muscular o patrón de movimiento. La investigación de Schoenfeld, Ogborn y Krieger (2016) comparó frecuencias de 1, 2 y 3 veces por semana con volumen igualado y encontró que 2-3 veces por semana produce mayor hipertrofia que 1 vez. El mecanismo propuesto es la elevación repetida de la síntesis proteica muscular: cada sesión de entrenamiento eleva la síntesis durante 24-48 horas en principiantes y 16-24 horas en avanzados. Entrenar un grupo muscular 2-3 veces por semana mantiene la síntesis proteica elevada durante más días del microciclo. Para entrenamiento de calle, esto se traduce en rutinas full-body o upper/lower 3-4 días por semana, en lugar de rutinas divididas (bro-splits) de 5-6 días.',
  'progressive_overload',
  ARRAY['frecuencia', 'sintesis proteica', 'hipertrofia', 'Schoenfeld', 'full-body']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Principio de especificidad SAID',
  'El principio SAID (Specific Adaptation to Imposed Demands) establece que el cuerpo se adapta específicamente al tipo de estrés aplicado. Si entrenas fuerza máxima (1-5 repeticiones), mejoras la capacidad neuromuscular de reclutar fibras pero ganas poca hipertrofia. Si entrenas en rangos de hipertrofia (6-12 repeticiones), ganas masa muscular pero menos fuerza máxima. Si entrenas resistencia (15+ repeticiones), mejoras la capacidad oxidativa. Para un programa de acondicionamiento general con peso corporal, la recomendación es variar los rangos de repeticiones: días de fuerza (5-8 repeticiones con progresiones difíciles), días de hipertrofia (8-15), y días de resistencia (15-25). Esta variación, conocida como periodización diaria o semanal, cubre múltiples cualidades sin que ninguna se estanque. La transferencia entre rangos existe pero es limitada.',
  'progressive_overload',
  ARRAY['SAID', 'especificidad', 'adaptacion', 'rangos de repeticiones', 'fuerza']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Tiempo bajo tensión y tempo de ejecución',
  'El tiempo bajo tensión (TUT) es la duración total de una serie, calculada como repeticiones × duración de cada fase (concéntrica + isométrica + excéntrica). Tradicionalmente se ha recomendado un TUT de 40-70 segundos para hipertrofia. Sin embargo, investigación reciente de Schoenfeld et al. (2015) sugiere que el TUT es menos importante que el número de repeticiones cercanas al fallo: 5 repeticiones con tempo 5-0-5-0 (50s TUT) producen hipertrofia similar a 10 repeticiones con tempo 1-0-1-0 (20s TUT) si ambas están cerca del fallo. La fase excéntrica (alargamiento muscular) es particularmente importante: descender controladamente en 2-3 segundos produce más estímulo hipertrófico y menos riesgo de lesión que fases excéntricas rápidas. Para ejercicios de calle, la recomendación es 2-1-2-0: 2 segundos bajando, 1 segundo de pausa, 2 segundos subiendo.',
  'progressive_overload',
  ARRAY['TUT', 'tempo', 'fase excentrica', 'Schoenfeld', 'ejecucion']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Progresiones y regresiones en calistenia',
  'Las cadenas de progresión y regresión son el equivalente en calistenia al aumento de peso en el gimnasio. Cada ejercicio tiene variantes más fáciles (regresiones) y más difíciles (progresiones) que manipulan la palanca biomecánica para ajustar la intensidad. Por ejemplo, la cadena de flexiones va: pared → rodillas → estándar → diamante → declinada → pica → handstand push-up. La cadena de dominadas: remo inclinado → australianas → chin-ups → pull-ups → arqueras → muscle-ups. El principio es cambiar el centro de masa relativo al punto de apoyo, aumentando o disminuyendo el porcentaje del peso corporal que los músculos deben mover. Un practicante debe progresar cuando puede hacer 8-12 repeticiones con buena técnica en una variante; si no puede hacer al menos 5, debe regresar a la variante anterior. Esta metodología permite sobrecarga progresiva sin pesos externos.',
  'progressive_overload',
  ARRAY['progresiones', 'regresiones', 'calistenia', 'biomecanica', 'peso corporal']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Deload y semanas de descarga',
  'Un deload es una reducción planificada del volumen y/o intensidad del entrenamiento, típicamente cada 4-8 semanas. La ciencia del ejercicio reconoce que el cuerpo no se adapta durante el entrenamiento, sino durante la recuperación post-entrenamiento. Después de 3-6 semanas de sobrecarga progresiva, la fatiga acumulada (muscular, neural, conectiva) supera el umbral donde el cuerpo puede seguir adaptándose. Una semana de deload — reduciendo el volumen al 40-60% manteniendo la intensidad — permite que el tejido conectivo se repare, los depósitos de glucógeno se rellenen, y el sistema nervioso se recupere. Esto resulta en un fenómeno llamado supercompensación: al volver al entrenamiento normal, el rendimiento es mayor que antes del deload. Ignorar los deloads lleva a estancamiento y eventualmente a lesiones por sobreuso. Para principiantes, cada 6-8 semanas; para avanzados, cada 4-5 semanas.',
  'progressive_overload',
  ARRAY['deload', 'descarga', 'supercompensacion', 'recuperacion', 'fatiga']
);

-- ============================================================================
-- PERIODIZATION (6)
-- ============================================================================

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Periodización lineal vs ondulante',
  'La periodización es la organización sistemática del entrenamiento en ciclos. La periodización lineal (o clásica) reduce el volumen y aumenta la intensidad progresivamente a lo largo de un mesociclo: semanas 1-2 alto volumen/baja intensidad, semanas 3-4 volumen moderado/alta intensidad. Es simple y efectiva para principiantes. La periodización ondulante (diaria o semanal) varía volumen e intensidad dentro de la misma semana: día 1 fuerza (5RM), día 2 hipertrofia (10RM), día 3 resistencia (20RM). Meta-análisis de Rhea et al. (2002) muestran que la periodización ondulante produce ganancias de fuerza ligeramente superiores en atletas intermedios y avanzados, mientras que en principiantes ambos métodos son equivalentes. Para entrenamiento de calle con sesiones generadas por IA, la ondulación diaria es ideal: la IA puede variar el estímulo de cada sesión basándose en el historial reciente.',
  'periodization',
  ARRAY['periodizacion', 'lineal', 'ondulante', 'Rhea', 'macrociclo']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Mesociclos y microciclos',
  'La estructura del entrenamiento se organiza en tres niveles: microciclo (1 semana), mesociclo (4-8 semanas) y macrociclo (6-12 meses). Un mesociclo de hipertrofia típico tiene 4-6 semanas de acumulación seguidas de 1 semana de deload. Un mesociclo de fuerza puede tener 3-4 semanas de intensificación con cargas altas (3-6 repeticiones) y volumen reducido. La clave es que cada mesociclo tenga un foco claro (hipertrofia, fuerza, resistencia, o skill) y que los mesociclos se encadenen lógicamente: un mesociclo de hipertrofia construye la base muscular para uno de fuerza, que a su vez prepara para uno de skill. Para el usuario de No Gym Club, la IA diseña el microciclo actual considerando en qué fase del mesociclo está, según el objetivo declarado en el assessment inicial.',
  'periodization',
  ARRAY['mesociclo', 'microciclo', 'macrociclo', 'planificacion', 'fases']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Periodización por bloques',
  'La periodización por bloques, desarrollada por Verkhoshansky, concentra el entrenamiento de una cualidad específica en bloques de 2-4 semanas. A diferencia de la periodización lineal donde se trabajan todas las cualidades simultáneamente, los bloques permiten enfocarse intensamente en una cualidad (ej. hipertrofia) mientras las otras se mantienen con dosis mínimas. Un bloque típico de hipertrofia consiste en alto volumen (15-20 series por grupo/semana) con intensidad moderada (60-75% 1RM). Le sigue un bloque de fuerza con menor volumen pero alta intensidad (>80% 1RM). Finalmente un bloque de potencia o skill donde el volumen es bajo pero la velocidad y complejidad son máximas. Este modelo es particularmente efectivo para atletas intermedios y avanzados que ya no progresan con periodización lineal. Para el contexto de No Gym Club, un bloque equivale a 2-3 semanas de sesiones con un tema dominante.',
  'periodization',
  ARRAY['bloques', 'Verkhoshansky', 'concentracion', 'fuerza', 'hipertrofia']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Entrenamiento concurrente: fuerza + resistencia',
  'El entrenamiento concurrente combina ejercicios de fuerza y resistencia en el mismo programa. La hipótesis de interferencia, propuesta por Hickson (1980), sugiere que las adaptaciones a la fuerza y a la resistencia pueden interferir entre sí a nivel molecular (vías mTOR vs AMPK). Sin embargo, investigación más reciente indica que esta interferencia es modesta y se puede mitigar con estrategias simples: separar las sesiones de fuerza y cardio por al menos 6 horas, priorizar la fuerza antes que el cardio en la misma sesión, asegurar ingesta proteica adecuada (1.6-2.2 g/kg/día), y mantener un superávit calórico ligero durante fases de hipertrofia. Para usuarios de No Gym Club, la recomendación es que las sesiones de fuerza/calistenia sean el foco principal, con cardio en días separados o al final de la sesión, no al inicio.',
  'periodization',
  ARRAY['concurrente', 'interferencia', 'Hickson', 'fuerza', 'cardio']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Entrenamiento por RPE y autorregulacion',
  'La autorregulación ajusta la carga de entrenamiento basándose en la percepción subjetiva del esfuerzo (RPE) en lugar de porcentajes fijos de 1RM. La escala RPE original de Borg (6-20) fue adaptada al entrenamiento de fuerza como RPE 1-10, donde 10 representa el máximo esfuerzo posible. La ventaja de la autorregulación es que se adapta automáticamente a la fatiga diaria: un día que el usuario llega descansado, el mismo RPE 8 produce más repeticiones que un día con fatiga acumulada. Esto elimina la necesidad de tests de 1RM frecuentes y evita sobreentrenamiento en días malos. Para No Gym Club, el usuario reporta RPE post-sesión y la IA ajusta el volumen e intensidad de la siguiente sesión: RPE 9-10 constante → reducir volumen; RPE 6-7 constante → aumentar.',
  'periodization',
  ARRAY['autorregulacion', 'RPE', 'Borg', 'ajuste diario', 'fatiga']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Planificación inversa desde el objetivo',
  'La planificación inversa comienza definiendo el objetivo final (ej. 10 dominadas estrictas en 12 semanas) y construye el camino hacia atrás. Se establecen hitos intermedios (semana 4: 4 dominadas; semana 8: 7 dominadas) y se diseña cada mesociclo para alcanzar el siguiente hito. Esta metodología es superior a simplemente "entrenar y ver qué pasa" porque proporciona un marco para evaluar si el progreso está en trayectoria. Si en la semana 4 el usuario solo logra 3 dominadas en lugar de 4, la IA ajusta el mesociclo siguiente (más volumen de tracción, más frecuencia). La planificación inversa requiere una evaluación inicial precisa (assessment) y evaluaciones periódicas (re-assessment mensual en el MVP).',
  'periodization',
  ARRAY['planificacion inversa', 'objetivo', 'hitos', 'trayectoria', 'ajuste']
);

-- ============================================================================
-- HYPERTROPHY (6)
-- ============================================================================

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Mecanismos de la hipertrofia muscular',
  'La hipertrofia muscular es el aumento del área transversal del músculo esquelético y ocurre principalmente por tres mecanismos: tensión mecánica, estrés metabólico y daño muscular. La tensión mecánica es el principal driver: cuando un músculo genera fuerza contra una resistencia, los mecanorreceptores en la membrana celular activan la vía mTOR, que estimula la síntesis proteica. El estrés metabólico (la acumulación de lactato, iones de hidrógeno y fosfato durante series de 30-60 segundos) contribuye al reclutamiento de fibras y a la liberación de hormonas anabólicas locales. El daño muscular microscópico activa células satélite que donan sus núcleos a las fibras musculares, aumentando su capacidad de producir proteínas. Para maximizar hipertrofia con peso corporal, se recomiendan series de 6-15 repeticiones llevadas a RIR 1-3, con 60-90 segundos de descanso entre series, 2-3 veces por semana por grupo muscular.',
  'hypertrophy',
  ARRAY['hipertrofia', 'mTOR', 'tension mecanica', 'estres metabolico', 'daño muscular']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Rangos de repeticiones para hipertrofia',
  'Los rangos de repeticiones tradicionalmente se clasifican en: fuerza (1-5), hipertrofia (6-12) y resistencia (15+). Sin embargo, meta-análisis recientes (Schoenfeld et al., 2014) demuestran que la hipertrofia puede lograrse en un espectro amplio de repeticiones (5-30), siempre que las series se lleven cerca del fallo (RIR 0-3). La diferencia está en la eficiencia: series de 5-8 repeticiones requieren más series totales para igualar el volumen de series de 10-15, y generan más fatiga neural. Series de 20-30 repeticiones producen mucha fatiga metabólica pero poca tensión mecánica. El rango óptimo de eficiencia para hipertrofia es 8-15 repeticiones. Para calistenia, esto significa elegir una progresión donde el usuario falle o esté cerca del fallo en ese rango. Si hace 20+ repeticiones de flexiones, necesita una progresión más difícil (diamante, declinada).',
  'hypertrophy',
  ARRAY['repeticiones', 'hipertrofia', 'Schoenfeld', 'rango optimo', 'calistenia']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Descanso entre series para hipertrofia',
  'El intervalo de descanso entre series afecta tanto al rendimiento como a la respuesta hormonal. Para hipertrofia, el rango recomendado es 60-90 segundos. Descansos más cortos (30-45s) reducen el número de repeticiones en series subsiguientes, disminuyendo el volumen total. Descansos más largos (3-5 minutos) permiten recuperación completa pero reducen el estrés metabólico y extienden innecesariamente la sesión. La investigación de Henselmans y Schoenfeld (2014) indica que 60-90 segundos es el punto óptimo: suficiente recuperación para mantener el volumen sin perder el efecto metabólico acumulativo. Para ejercicios compuestos demandantes (dominadas, muscle-ups), se puede extender a 120 segundos. Para ejercicios de aislamiento, 60 segundos es suficiente. La IA de No Gym Club prescribe descansos dentro de este rango según la dificultad del ejercicio.',
  'hypertrophy',
  ARRAY['descanso', 'series', 'Henselmans', 'volumen', 'recuperacion']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Proteinas e hipertrofia: timing y cantidad',
  'La síntesis proteica muscular neta depende del balance entre síntesis y degradación. El entrenamiento de fuerza estimula ambas; la ingesta proteica inclina la balanza hacia la síntesis. La recomendación actual (Morton et al., 2018) es 1.6-2.2 gramos de proteína por kg de peso corporal por día, distribuidos en 3-5 comidas con 0.4-0.55 g/kg por comida. El timing post-entrenamiento (la ventana anabólica) es menos crítico de lo que se pensaba: la síntesis proteica permanece elevada 24-48 horas post-entrenamiento. Consumir 20-40g de proteína dentro de las 2 horas post-entrenamiento es suficiente para maximizar la respuesta. Para usuarios de No Gym Club, la recomendación principal es alcanzar la ingesta diaria total; el timing es secundario.',
  'hypertrophy',
  ARRAY['proteina', 'sintesis', 'Morton', 'nutricion', 'timing']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Fallo muscular: cuándo y cómo usarlo',
  'El fallo muscular ocurre cuando no se puede completar otra repetición con buena técnica. Existen dos tipos: fallo concéntrico (no poder subir) y fallo técnico (la forma se degrada). El fallo técnico debe ser el límite en la mayoría de los casos: seguir haciendo repeticiones con mala técnica aumenta el riesgo de lesión sin beneficio hipertrófico adicional. El fallo absoluto recluta todas las fibras disponibles pero genera fatiga desproporcionada al estímulo. La recomendación basada en evidencia es: usar RIR 1-2 (muy cerca del fallo) en la mayoría de las series, reservar el fallo absoluto para la última serie de ejercicios de bajo riesgo (flexiones, no handstands), y nunca entrenar al fallo en ejercicios de alta complejidad técnica o que involucren la columna bajo carga.',
  'hypertrophy',
  ARRAY['fallo muscular', 'RIR', 'seguridad', 'tecnica', 'concetrico']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Entrenamiento de cuerpo completo vs dividido',
  'Las rutinas de cuerpo completo (full-body) entrenan todos los grupos musculares en cada sesión, típicamente 3 veces por semana. Las rutinas divididas (split) asignan diferentes grupos a diferentes días (ej. push/pull/legs). Para principiantes e intermedios, la evidencia favorece full-body 3 días/semana: mayor frecuencia de estimulo por grupo muscular, mejor aprendizaje motor por la repetición frecuente de los patrones, y más eficiente en tiempo. Para avanzados que necesitan mayor volumen, un split push/pull/legs 4-6 días/semana permite más series por grupo sin que las sesiones duren 2+ horas. No Gym Club está optimizado para full-body y upper/lower, dado que los usuarios entrenan 3-5 días por semana con equipamiento de calle mínimo. La IA elige la distribución según los días disponibles declarados en el perfil.',
  'hypertrophy',
  ARRAY['full-body', 'split', 'frecuencia', 'principiante', 'push-pull-legs']
);

-- ============================================================================
-- ENDURANCE (5)
-- ============================================================================

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Adaptaciones cardiovasculares al entrenamiento',
  'El entrenamiento cardiovascular produce adaptaciones centrales (corazón, pulmones, sangre) y periféricas (músculos, capilares, mitocondrias). A nivel central: aumento del volumen sistólico (más sangre por latido), disminución de la frecuencia cardíaca en reposo (bradicardia del deportista), y aumento del volumen plasmático. A nivel periférico: angiogénesis (nuevos capilares), biogénesis mitocondrial (más y mejores mitocondrias), y mejora en la capacidad oxidativa de las fibras musculares. Estas adaptaciones comienzan a ser medibles en 2-4 semanas de entrenamiento consistente. La magnitud de la adaptación depende del tipo de entrenamiento: el HIIT produce más mejoras en VO2max; el LISS (cardio prolongado de baja intensidad) produce más angiogénesis y eficiencia metabólica. Una combinación de ambos es superior a cualquiera por separado.',
  'endurance',
  ARRAY['cardiovascular', 'VO2max', 'mitocondrias', 'angiogenesis', 'adaptacion']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'HIIT vs LISS: cuándo usar cada uno',
  'HIIT (High-Intensity Interval Training) consiste en intervalos cortos de alta intensidad (80-95% FCmax) alternados con recuperación. LISS (Low-Intensity Steady State) es cardio continuo a intensidad moderada (60-70% FCmax) durante 30-60 minutos. El HIIT es más eficiente en tiempo (20 minutos de HIIT producen mejoras de VO2max similares a 45-60 minutos de LISS), genera mayor EPOC (exceso de consumo de oxígeno post-ejercicio, quemando calorías extra por horas), y preserva mejor la masa muscular. El LISS tiene ventajas: menor estrés articular y sistémico, puede hacerse a diario sin interferir con la recuperación de la fuerza, y es mejor para la oxidación de grasas durante el ejercicio. Para usuarios de No Gym Club que buscan perder grasa sin sacrificar músculo, 2-3 sesiones de HIIT de 15-20 minutos por semana + 1-2 de LISS de 30-40 minutos es una combinación óptima.',
  'endurance',
  ARRAY['HIIT', 'LISS', 'EPOC', 'VO2max', 'perdida de grasa']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Zonas de frecuencia cardíaca',
  'Las zonas de entrenamiento por frecuencia cardíaca se definen como porcentajes de la frecuencia cardíaca máxima (FCmax ≈ 220 - edad). Zona 1 (50-60%): muy suave, recuperación activa. Zona 2 (60-70%): quema de grasa óptima, base aeróbica, puede mantenerse 60+ minutos. Zona 3 (70-80%): mejora de la capacidad aeróbica, umbral donde el lactato empieza a acumularse. Zona 4 (80-90%): umbral anaeróbico, HIIT, solo sostenible 5-20 minutos. Zona 5 (90-100%): esfuerzo máximo, sprints, solo unos segundos a 2 minutos. Para salud general y base de acondicionamiento, 80% del volumen cardiovascular debe ser en Zona 2. Para mejoras de rendimiento, 20% en Zonas 4-5 (HIIT). La IA de No Gym Club puede sugerir tipo e intensidad de cardio según el objetivo del usuario y su historial de sesiones.',
  'endurance',
  ARRAY['zonas cardiacas', 'FCmax', 'umbral', 'lactato', 'aerobico']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Entrenamiento de resistencia para principiantes',
  'Para una persona sedentaria que inicia un programa de acondicionamiento, la prioridad es construir una base aeróbica segura. Las primeras 4-8 semanas deben enfocarse en consistencia más que en intensidad: 3-4 sesiones semanales de 20-30 minutos en Zona 2 (conversacional, ritmo donde se puede hablar). Aumentar 5-10 minutos por semana hasta alcanzar 40-60 minutos por sesión. Solo después de esta base (semana 8+) se introduce HIIT: 1 sesión semanal de 4-6 intervalos de 30 segundos a alta intensidad con 90 segundos de recuperación, aumentando progresivamente. Este enfoque reduce el riesgo de lesiones, abandono y sobreentrenamiento. La razón más común de abandono en principiantes no es la falta de resultados sino hacer demasiado demasiado pronto.',
  'endurance',
  ARRAY['principiante', 'base aerobica', 'progresion', 'consistencia', 'seguridad']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Economía de carrera y técnica de sprint',
  'La economía de carrera es el consumo de oxígeno a una velocidad submáxima dada. Una mejor economía significa que se gasta menos energía para la misma velocidad. Se mejora con: entrenamiento de fuerza de miembros inferiores (sentadillas, zancadas, saltos), técnica de carrera (cadencia 170-180 pasos/minuto, apoyo de medio-pie, zancada corta), y entrenamiento pliométrico de baja intensidad. Para usuarios de No Gym Club que incluyen sprints o carrera en su entrenamiento, la recomendación es integrar ejercicios de técnica (skipping, talones al glúteo) como calentamiento, y ejercicios de fuerza de piernas en las sesiones regulares. Un calentamiento típico puede incluir 2-3 minutos de skipping + 2-3 aceleraciones progresivas de 40-60 metros antes de los sprints principales.',
  'endurance',
  ARRAY['economia de carrera', 'sprint', 'tecnica', 'cadencia', 'pliometria']
);

-- ============================================================================
-- RECOVERY (7)
-- ============================================================================

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Ventana de recuperación post-entrenamiento',
  'La recuperación post-entrenamiento es el período donde ocurren las adaptaciones. Las primeras 2 horas post-ejercicio son críticas para la resíntesis de glucógeno y la iniciación de la síntesis proteica. Consumir carbohidratos (1-1.2 g/kg) y proteína (0.3-0.5 g/kg) en esta ventana acelera la recuperación. La rehidratación es igualmente importante: reponer 150% del peso perdido en sudor (si perdiste 1 kg, beber 1.5L). El sueño es el factor más potente de recuperación: durante el sueño profundo (NREM etapa 3), se libera hormona de crecimiento (GH) y testosterona, ambas anabólicas. Dormir menos de 7 horas consistentemente reduce la síntesis proteica, aumenta el cortisol, y eleva el riesgo de lesión. Para el usuario de No Gym Club, la IA pregunta por calidad de sueño y fatiga percibida para ajustar la intensidad de la sesión.',
  'recovery',
  ARRAY['ventana anabolica', 'glucogeno', 'sueño', 'hormona de crecimiento', 'rehidratacion']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Recuperación modulada por edad',
  'La capacidad de recuperación disminuye con la edad debido a varios factores: reducción en la producción de testosterona y hormona de crecimiento (a partir de los 30-35 años), disminución del flujo sanguíneo a los tejidos conectivos (menor llegada de nutrientes), acortamiento de los telómeros en células satélite (menor capacidad regenerativa), y mayor tiempo para la resíntesis de proteínas musculares. En términos prácticos: un adulto de 45 años necesita aproximadamente 25-40% más de tiempo de recuperación entre sesiones que uno de 25 años para el mismo estímulo. Esto se traduce en: menor frecuencia (2-3 sesiones semanales vs 4-5 para jóvenes), mayor énfasis en deloads regulares (cada 4 semanas en lugar de cada 6-8), y más días de recuperación activa (caminar, movilidad). La IA de No Gym Club usa la edad como variable de entrada en el modelo de recuperación para ajustar estos parámetros.',
  'recovery',
  ARRAY['edad', 'recuperacion', 'testosterona', 'telomeros', 'adulto mayor']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Sueño y rendimiento deportivo',
  'El sueño es el principal mecanismo de recuperación del cuerpo humano. Durante el sueño NREM profundo (etapa 3), el cuerpo libera pulsos de hormona de crecimiento que estimulan la reparación tisular y la síntesis proteica. La privación parcial de sueño (4-5 horas por noche durante 2-3 días) reduce la fuerza máxima en un 5-8%, la capacidad de sprint en un 10-15%, y la precisión técnica en ejercicios complejos en hasta un 20%. La higiene del sueño para atletas incluye: horario consistente (acostarse y despertar a la misma hora), temperatura ambiente 18-20°C, cero pantallas 60-90 minutos antes de dormir, y evitar cafeína después de las 14:00. Siestas de 20-30 minutos (no más para evitar entrar en sueño profundo) pueden complementar el sueño nocturno y mejorar el rendimiento vespertino.',
  'recovery',
  ARRAY['sueño', 'NREM', 'hormona de crecimiento', 'higiene del sueño', 'rendimiento']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Fatiga del sistema nervioso central (SNC)',
  'La fatiga del SNC es distinta de la fatiga muscular periférica. Mientras la fatiga muscular se siente como quemazón o debilidad local, la fatiga neural se manifiesta como falta de motivación, lentitud en movimientos explosivos, tiempos de reacción aumentados, y sensación general de pesadez. Ocurre porque las neuronas motoras reducen su tasa de disparo después de exposiciones repetidas a estímulos de alta intensidad. El SNC se recupera más lento que los músculos: 24-48 horas para los músculos, 48-72 horas o más para el SNC después de sesiones muy intensas (cerca del fallo, cargas máximas). Síntomas de fatiga neural: disminución de la fuerza de agarre matutina, irritabilidad, sueño no reparador. Si la IA de No Gym Club detecta que el usuario reporta RPE 9-10 varias sesiones seguidas, debe prescribir una sesión de descarga o recuperación activa, independientemente del grupo muscular programado.',
  'recovery',
  ARRAY['SNC', 'fatiga neural', 'neurona motora', 'sobreentrenamiento', 'RPE']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Masaje, foam rolling y recuperación',
  'El foam rolling (autoliberación miofascial) y el masaje deportivo son técnicas de recuperación con evidencia moderada. Meta-análisis recientes muestran que el foam rolling post-ejercicio reduce la percepción de dolor muscular (DOMS) en un 15-20% y acelera marginalmente la recuperación del rango de movimiento, pero no acelera significativamente la recuperación de la fuerza o la potencia. El mecanismo propuesto no es romper adherencias (mito) sino estimular mecanorreceptores que envían señales inhibitorias al sistema nervioso, reduciendo el tono muscular. El foam rolling es más efectivo como parte del calentamiento (30-60 segundos por grupo muscular, rodar lento) que como recuperación post-ejercicio. Si un usuario de No Gym Club tiene acceso a foam roller, la IA puede sugerir su uso en el calentamiento para mejorar el rango de movimiento temporal antes de ejercicios de pierna.',
  'recovery',
  ARRAY['foam rolling', 'masaje', 'DOMS', 'miofascial', 'calentamiento']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Periodo de descanso entre sesiones',
  'El descanso entre sesiones varía según el tipo de entrenamiento y el nivel del practicante. Para sesiones de fuerza/hipertrofia de cuerpo completo, principiantes necesitan 48 horas entre sesiones (ej. lunes-miércoles-viernes), intermedios 48-72 horas, y avanzados hasta 72 horas si el volumen es muy alto. Para sesiones divididas (upper/lower), se puede entrenar en días consecutivos siempre que se alternen los grupos musculares. Señales de que se necesita más descanso: rendimiento decreciente en la misma sesión (menos repeticiones en series subsiguientes), dolor muscular que limita el rango de movimiento, frecuencia cardíaca en reposo elevada (5+ pulsos por encima de lo normal), y sueño de mala calidad. La IA de No Gym Club monitorea el RPE post-sesión y el rendimiento (repeticiones totales vs sesiones anteriores) para detectar necesidad de descanso adicional.',
  'recovery',
  ARRAY['descanso entre sesiones', 'frecuencia', 'upper-lower', 'señales', 'sobreentrenamiento']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Nutrición post-entrenamiento para la recuperación',
  'La nutrición post-entrenamiento tiene tres objetivos: reponer glucógeno muscular, proporcionar aminoácidos para la síntesis proteica, y rehidratar. Para reponer glucógeno se recomiendan 1-1.2 g de carbohidratos por kg de peso corporal en las primeras 2 horas, idealmente de alto índice glucémico (arroz, papa, fruta). La proteína debe ser de alto valor biológico (huevo, suero, carne magra) en dosis de 0.3-0.5 g/kg. La combinación de carbohidratos + proteína en proporción 3:1 o 4:1 estimula mayor liberación de insulina, que a su vez acelera la captación de aminoácidos y glucosa por el músculo. La ventana de 2 horas no es un interruptor binario a las 2:01, sino una curva que decae gradualmente. Si la siguiente comida completa ocurre dentro de las 2-3 horas post-ejercicio, no es necesario un batido específico; esa comida cubre las necesidades.',
  'recovery',
  ARRAY['nutricion', 'glucogeno', 'proteina', 'insulina', 'ventana metabolica']
);

-- ============================================================================
-- RPE / AUTOREGULATION (6)
-- ============================================================================

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Escala RPE 1-10 en fuerza',
  'La escala RPE (Rate of Perceived Exertion) adaptada para fuerza va del 1 al 10: RPE 6 = esfuerzo moderado, podría hacer 4-5 repeticiones más; RPE 7 = esfuerzo considerable, 3 repeticiones más; RPE 8 = difícil, 2 repeticiones más (RIR 2); RPE 9 = muy difícil, 1 repetición más (RIR 1); RPE 10 = máximo esfuerzo, no podría hacer ni una repetición más. La escala es subjetiva pero se vuelve precisa con práctica: estudios muestran que después de 2-4 semanas de uso consistente, los usuarios estiman su RIR real con un error de ±0.5 repeticiones. Para sesiones de No Gym Club, el usuario reporta RPE al final de cada ejercicio o de la sesión completa. Este dato es crucial para que la IA ajuste el volumen e intensidad de la siguiente sesión.',
  'rpe_autoregulation',
  ARRAY['RPE', 'RIR', 'escala', 'esfuerzo', 'subjetivo']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'RIR (Reps in Reserve) — implementación práctica',
  'RIR mide cuántas repeticiones podrías haber hecho adicionalmente con buena técnica. RIR 2 significa que paraste cuando podías hacer 2 más. La literatura muestra que entrenar consistentemente en RIR 1-3 produce hipertrofia y fuerza equivalentes a entrenar al fallo, con menor fatiga. La implementación práctica requiere práctica: en las primeras 2 semanas pide al usuario que haga una serie hasta el fallo real (con seguridad, en ejercicios de bajo riesgo) para calibrar su percepción. Después, entrena en RIR 2-3. La IA de No Gym Club puede sugerir ocasionalmente series de calibración (una serie al fallo en un ejercicio seguro como flexiones) para mantener la precisión de la autorregulación.',
  'rpe_autoregulation',
  ARRAY['RIR', 'calibracion', 'fallo', 'percepcion', 'precision']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Ajuste de carga basado en velocidad (VBT)',
  'El entrenamiento basado en velocidad (VBT) usa la velocidad de la barra o del movimiento como proxy de la intensidad. Aunque típicamente requiere equipo especializado (acelerómetros), el principio se puede aplicar de forma cualitativa: si la velocidad de la fase concéntrica disminuye notablemente (la repetición se vuelve más lenta), el usuario está cerca del fallo. La pérdida de velocidad del 20% (la última repetición es 20% más lenta que la primera) corresponde aproximadamente a RIR 2-3. Parar las series aquí, en lugar de llegar a velocidad cero (fallo), preserva la calidad de las repeticiones y reduce la fatiga. Para usuarios de No Gym Club sin equipo, la instrucción cualitativa es: terminá la serie cuando sentís que la próxima repetición va a ser notablemente más lenta, no cuando ya no podés moverte.',
  'rpe_autoregulation',
  ARRAY['VBT', 'velocidad', 'perdida de velocidad', 'calidad', 'fatiga']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Sesiones de alta vs baja gravedad (RPE alto vs bajo)',
  'Alternar sesiones de alto RPE (8-9, intensas) con sesiones de bajo RPE (5-7, moderadas) permite mantener la frecuencia de entrenamiento alta sin acumular fatiga excesiva. Un esquema típico semanal: lunes RPE 8-9 (pesado), miércoles RPE 6-7 (moderado), viernes RPE 8-9 (pesado). Las sesiones moderadas del miércoles no son wasted sessions: mantienen el estímulo, refuerzan la técnica, y ayudan a la recuperación activa. Para un usuario de No Gym Club que entrena 4 días/semana, el patrón puede ser: día 1 pesado, día 2 moderado, día 3 descanso, día 4 pesado, día 5 moderado, días 6-7 descanso. La IA asigna el RPE objetivo de cada sesión según el historial reciente y los días desde la última sesión intensa.',
  'rpe_autoregulation',
  ARRAY['sesiones', 'gravedad', 'frecuencia', 'moderado', 'pesado']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Fatiga neuromuscular periférica vs central',
  'La fatiga periférica ocurre dentro del músculo (depleción de ATP, acumulación de metabolitos, fallo en el acoplamiento excitación-contracción). Se recupera en minutos a horas. La fatiga central ocurre en el sistema nervioso (reducción en la tasa de disparo de motoneuronas, disminución del drive cortical). Se recupera en horas a días. Un usuario puede tener los músculos frescos pero el SNC fatigado, o viceversa. Síntomas de fatiga periférica: sensación de bombeo, temblor, debilidad localizada. Síntomas de fatiga central: falta de explosividad, tiempos de reacción lentos, sensación general de pesadez sin congestión muscular. La IA de No Gym Club usa el RPE diferenciado: RPE alto con sensación de debilidad general sugiere fatiga central; RPE alto con congestión localizada sugiere fatiga periférica. El ajuste de la siguiente sesión es distinto en cada caso.',
  'rpe_autoregulation',
  ARRAY['fatiga periferica', 'fatiga central', 'SNC', 'ATP', 'motoneuronas']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Readiness score: preparación para entrenar',
  'El readiness score (puntaje de preparación) integra múltiples variables para determinar si el usuario está listo para una sesión intensa: frecuencia cardíaca en reposo (elevada = menos preparado), variabilidad de la frecuencia cardíaca o HRV (baja = sistema nervioso estresado), calidad del sueño (mala = menos preparado), dolor muscular residual, estado de ánimo y motivación. En el MVP de No Gym Club, la versión simplificada usa 3 preguntas al inicio de cada sesión: ¿Cuántas horas dormiste anoche? ¿Cómo sentís tu cuerpo? (1=descansado, 5=agotado) ¿Cuál es tu nivel de energía? (1-5). Con estos datos, la IA puede sugerir: sesión completa, sesión reducida (-20% volumen), o día de recuperación activa. Este sistema simple de readiness score es suficiente para evitar la mayoría de los casos de sobreentrenamiento.',
  'rpe_autoregulation',
  ARRAY['readiness', 'HRV', 'preparacion', 'frecuencia cardiaca', 'sueño']
);

-- ============================================================================
-- BODYWEIGHT TRAINING (7)
-- ============================================================================

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Adaptaciones neuromusculares en calistenia',
  'El entrenamiento con peso corporal produce adaptaciones neuromusculares distintas al entrenamiento con pesas. La calistenia requiere mayor coordinación intermuscular (varios grupos trabajando en sincronía), mayor activación del core como estabilizador, y mayor demanda propioceptiva (conciencia espacial del cuerpo). Estas adaptaciones neuromusculares explican por qué un calisténico avanzado puede hacer 30+ dominadas pero quizás no levante 1.5x su peso en jalón al pecho en polea: la fuerza es específica al patrón de movimiento. La ventaja de la calistenia es que desarrolla fuerza funcional transferible a movimientos reales (empujar, jalar, sostener el cuerpo) y construye una base de control motor que acelera el aprendizaje de nuevas habilidades. La desventaja es que la progresión de carga es menos granular que agregar discos a una barra.',
  'bodyweight_training',
  ARRAY['neuromuscular', 'coordinacion', 'propiocepcion', 'fuerza funcional', 'core']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Principio de sobrecarga en calistenia sin pesos',
  'Sin pesos externos, la sobrecarga en calistenia se logra mediante: palanca (aumentar la distancia entre el punto de apoyo y el centro de masa), unilateralidad (pasar de dos brazos a uno), rango de movimiento (aumentar la profundidad), tempo (ralentizar la fase excéntrica), volumen (más series y repeticiones), y frecuencia (más sesiones por semana). La progresión más efectiva es la mecánica (cambiar la palanca): pasar de flexiones normales a diamante, luego a declinadas, luego a pica, y finalmente a handstand push-ups. Cada progresión aumenta el porcentaje de peso corporal que los músculos deben mover. La recomendación es cambiar de progresión cuando el usuario puede hacer 3-4 series de 8-12 repeticiones con buena técnica en la variante actual.',
  'bodyweight_training',
  ARRAY['sobrecarga', 'palanca', 'unilateral', 'progresion', 'sin pesos']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Skill acquisition: del aprendizaje motor a la automaticidad',
  'El aprendizaje de habilidades motoras (handstand, muscle-up, front lever) sigue tres etapas: cognitiva (el practicante piensa activamente cada paso, movimientos torpes y variables), asociativa (los movimientos se refinan, se cometen menos errores, el practicante detecta y corrige sus propios errores), y autónoma (el movimiento es fluido y automático, no requiere atención consciente). La transición entre etapas requiere repeticiones de calidad: 100-300 repeticiones para pasar de cognitiva a asociativa en habilidades simples, 1000-5000 para habilidades complejas. La práctica distribuida (poco cada día) es superior a la práctica masiva (mucho en un día) para la retención a largo plazo. Para No Gym Club, si un usuario tiene "master skills" como objetivo, la IA debe programar práctica de habilidad al inicio de la sesión (cuando el SNC está fresco), antes de los ejercicios de fuerza.',
  'bodyweight_training',
  ARRAY['skill', 'aprendizaje motor', 'automaticidad', 'practica distribuida', 'handstand']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Core y estabilidad en ejercicios de calle',
  'En calistenia, el core no es solo los abdominales: es todo el sistema que estabiliza la columna y la pelvis durante el movimiento. Incluye el transverso abdominal (cinturón natural), oblicuos, erectores espinales, diafragma y piso pélvico. Un core fuerte no es visible desde afuera (six-pack), sino funcional: la capacidad de mantener la columna neutra bajo carga. En ejercicios como el front lever, el core es el limitante principal, no los dorsales. Entrenar el core para calistenia requiere ejercicios de anti-extensión (plancha, hollow body), anti-rotación (pallof press con banda), y anti-flexión lateral (caminata de granjero unilateral). Los ejercicios tradicionales de abdominales (crunches) tienen poca transferencia a las demandas de estabilización de la calistenia.',
  'bodyweight_training',
  ARRAY['core', 'estabilidad', 'transverso', 'hollow body', 'anti-extension']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Entrenamiento de fuerza isométrica en calistenia',
  'Las contracciones isométricas (mantener una posición sin movimiento) desarrollan fuerza específica en el ángulo entrenado, con poca transferencia a otros ángulos (±15-20 grados). Esto las hace ideales para superar sticking points (puntos débiles) en ejercicios de calistenia. Por ejemplo: mantener la posición superior de una dominada (barbilla sobre la barra) durante 10-30 segundos fortalece el rango final, que suele ser el más débil. Los isométricos también son más seguros para tendones y articulaciones que los ejercicios dinámicos y producen un efecto analgésico temporal (reduce el dolor en tendinopatías). La recomendación: 2-3 series de 15-30 segundos al 80-100% del esfuerzo máximo, 2-3 veces por semana, como complemento a los ejercicios dinámicos, no como reemplazo.',
  'bodyweight_training',
  ARRAY['isometrico', 'sticking point', 'tendones', 'angulo', 'complemento']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Fortalecimiento de tendones y articulaciones',
  'Los tendones y ligamentos se adaptan más lento que los músculos debido a su menor vascularización. Mientras los músculos muestran hipertrofia medible en 4-8 semanas, los tendones pueden tardar 8-16 semanas en aumentar su área transversal significativamente. Esto crea un desfase peligroso en principiantes entusiastas: los músculos progresan rápido y permiten cargas mayores, pero los tendones aún no se han adaptado, resultando en tendinopatías (codo de tenista, hombro del lanzador, rodilla del saltador). La prevención incluye: progresión lenta (no más de 10% de aumento de volumen semanal), ejercicios excéntricos pesados, y movilidad articular diaria. Para No Gym Club, si el assessment indica que el usuario es principiante, las primeras 4 semanas deben ser de adaptación tendinosa con volumen moderado, independientemente de que el usuario se sienta capaz de más.',
  'bodyweight_training',
  ARRAY['tendones', 'ligamentos', 'adaptacion', 'tendinopatia', 'principiante']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Entrenamiento de empuje y tracción: balance estructural',
  'El balance entre musculatura de empuje (pecho, hombro anterior, tríceps) y tracción (dorsales, romboides, bíceps) es crítico para la salud del hombro. La mayoría de las personas tienen desbalance por dominancia de empuje: pasan el día con los hombros hacia adelante (computadora, teléfono) y en el gimnasio priorizan press de banca sobre remo. En calistenia, la regla es: al menos tanto volumen de tracción como de empuje, idealmente 1.5:1 a favor de tracción para corregir la postura. Esto significa: por cada serie de flexiones, 1-2 series de remo o dominadas. Para No Gym Club, la IA debe asegurar que el volumen semanal de tracción nunca sea inferior al de empuje. Si el usuario declara dolor de hombro, la proporción sube a 3:1.',
  'bodyweight_training',
  ARRAY['balance estructural', 'empuje', 'traccion', 'hombro', 'postura']
);

-- ============================================================================
-- SAFETY SCREENING (5)
-- ============================================================================

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'PAR-Q y evaluación pre-participación',
  'El PAR-Q (Physical Activity Readiness Questionnaire) es un screening de 7 preguntas diseñado para identificar personas que requieren evaluación médica antes de iniciar un programa de ejercicio. Fue desarrollado por la Canadian Society for Exercise Physiology y es utilizado globalmente como primer filtro de seguridad. Las preguntas cubren: condiciones cardíacas, dolor torácico, mareos, problemas articulares, hipertensión, contraindicación médica, y otros motivos de preocupación. Si el participante responde SÍ a cualquiera, se recomienda consulta médica antes de iniciar. Es importante destacar que el PAR-Q no diagnostica ni contraindica absolutamente: es un filtro de precaución. Un SÍ en PAR-Q no significa que la persona no pueda entrenar, sino que debe ser evaluada por un profesional de la salud primero.',
  'safety_screening',
  ARRAY['PAR-Q', 'screening', 'seguridad', 'CSEP', 'pre-participacion']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Contraindicaciones absolutas y relativas para ejercicio intenso',
  'Contraindicaciones absolutas (no entrenar sin autorización médica): infarto de miocardio reciente (menos de 6 semanas), angina inestable, arritmia no controlada, estenosis aórtica severa, insuficiencia cardíaca descompensada, aneurisma disecante, hipertensión no controlada (sistólica >180 o diastólica >110 en reposo). Contraindicaciones relativas (precaución, intensidad reducida): hipertensión moderada, diabetes no controlada, obesidad severa (IMC >40), embarazo (sin programa específico), edad avanzada sin evaluación previa. Para usuarios de No Gym Club con alguna de estas condiciones, la IA debe recomendar evaluación médica y, si el usuario ya tiene autorización, limitar la intensidad a RPE 5-7 máximo y evitar ejercicios isométricos prolongados (que elevan la presión arterial más que los dinámicos).',
  'safety_screening',
  ARRAY['contraindicaciones', 'cardiaco', 'hipertension', 'precaucion', 'intensidad']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Señales de alarma durante el ejercicio',
  'Durante una sesión de entrenamiento, hay señales que indican detener el ejercicio inmediatamente y buscar atención médica si persisten: dolor torácico o presión en el pecho (no confundir con fatiga muscular del pectoral), mareo o sensación de desmayo inminente, dificultad respiratoria desproporcionada al esfuerzo, palpitaciones irregulares o muy rápidas (>200 pulsaciones por minuto en menores de 40 años), dolor articular agudo (no muscular) que empeora con cada repetición, y pérdida súbita de fuerza en un lado del cuerpo. En el contexto de No Gym Club, las instrucciones de cada sesión generada por IA deben incluir un recordatorio breve: interrumpir el ejercicio ante cualquiera de estas señales.',
  'safety_screening',
  ARRAY['señales de alarma', 'dolor toracico', 'mareo', 'emergencia', 'seguridad']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Progresión segura para principiantes absolutos',
  'Un principiante absoluto (sin historial de ejercicio en los últimos 12 meses) requiere un período de adaptación anatómica de 4-6 semanas antes de cualquier entrenamiento intenso. Durante este período, el foco es: técnica correcta en ejercicios básicos, acondicionamiento cardiovascular de base (caminar 20-30 minutos, 3-4 veces por semana), y movilidad articular general. El volumen de fuerza debe ser bajo: 2-3 series de 8-12 repeticiones en regresiones simples (flexiones de pared, remo inclinado, sentadilla asistida). La intensidad no debe superar RPE 6-7. Solo después de este período se introducen progresiones más difíciles y mayor volumen. El error más común de principiantes (y entrenadores) es empezar demasiado fuerte: la motivación inicial lleva a hacer más de lo que el cuerpo puede tolerar, resultando en DOMS extremo, abandono o lesión.',
  'safety_screening',
  ARRAY['principiante', 'adaptacion anatomica', 'progresion segura', 'tecnica', 'DOMS']
);

INSERT INTO sport_science_corpus (title, content, category, tags) VALUES (
  'Calentamiento estructurado para prevención de lesiones',
  'Un calentamiento efectivo reduce el riesgo de lesión en un 30-50% según estudios epidemiológicos en deportes. La estructura recomendada tiene tres fases: (1) activación cardiovascular (5-10 minutos de trote suave, skipping o jumping jacks para elevar la temperatura corporal), (2) movilidad dinámica (5 minutos de ejercicios de rango de movimiento activo como círculos de brazos, balanceos de pierna, rotaciones de torso — nunca estiramientos estáticos prolongados), y (3) sets de aproximación (2-3 series del primer ejercicio con intensidad creciente: 50%, 70%, 90% del esfuerzo de trabajo). Para una sesión de No Gym Club de 30-45 minutos, el calentamiento debe durar 7-10 minutos. Si la sesión incluye un ejercicio de alta demanda técnica (handstands, muscle-ups), el calentamiento debe incluir ejercicios específicos de activación para esa habilidad.',
  'safety_screening',
  ARRAY['calentamiento', 'prevencion', 'movilidad dinamica', 'aproximacion', 'lesion']
);
