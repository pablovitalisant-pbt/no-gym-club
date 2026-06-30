-- Seed: Catalogo No Gym Club — 32 ejercicios de calle
-- Todas las categorias, niveles de dificultad, y equipamiento del sistema.
-- URLs de media: placeholder. Bilingüe ES/EN.

-- ============================================================================
-- PUSH (6)
-- ============================================================================

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'wall-push-up',
  'Flexiones en pared', 'Wall Push-Up',
  'Flexión vertical contra una pared. Ideal para principiantes absolutos o calentamiento.',
  'Vertical push against a wall. Ideal for absolute beginners or warm-up.',
  ARRAY['Colocate frente a una pared a un brazo de distancia', 'Apoya las palmas a la altura del pecho', 'Flexiona los codos llevando el pecho hacia la pared', 'Empuja para volver a la posicion inicial'],
  ARRAY['Stand arm''s length from a wall', 'Place palms at chest height', 'Bend elbows bringing chest toward wall', 'Push back to starting position'],
  ARRAY['chest', 'triceps'], ARRAY['shoulders'], ARRAY['bodyweight', 'wall']::equipment_type[], 'beginner', 'push',
  '/exercises/wall-push-up.jpg', '/exercises/wall-push-up.gif', '/exercises/wall-push-up.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'knee-push-up',
  'Flexiones de rodillas', 'Knee Push-Up',
  'Flexion con rodillas apoyadas. Progresion hacia la flexion completa.',
  'Push-up with knees on the ground. Progression toward full push-up.',
  ARRAY['Colocate en cuatro puntos con rodillas apoyadas', 'Manos a la altura de los hombros', 'Baja el pecho controladamente flexionando codos', 'Empuja hasta extender los brazos'],
  ARRAY['Start on all fours, knees on ground', 'Hands at shoulder width', 'Lower chest with control, bending elbows', 'Push up until arms are extended'],
  ARRAY['chest', 'triceps'], ARRAY['shoulders', 'core'], ARRAY['bodyweight', 'ground']::equipment_type[], 'beginner', 'push',
  '/exercises/knee-push-up.jpg', '/exercises/knee-push-up.gif', '/exercises/knee-push-up.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'push-up',
  'Flexion de brazos', 'Push-Up',
  'Ejercicio fundamental de empuje. Trabaja pecho, triceps y hombros.',
  'Fundamental pushing exercise. Works chest, triceps and shoulders.',
  ARRAY['Colocate en plancha con manos al ancho de hombros', 'Cuerpo recto de pies a cabeza', 'Baja flexionando codos hasta casi tocar el suelo', 'Empuja hacia arriba manteniendo el core firme'],
  ARRAY['Start in plank, hands shoulder-width', 'Body straight from head to feet', 'Lower by bending elbows until chest nearly touches ground', 'Push up keeping core tight'],
  ARRAY['chest', 'triceps', 'shoulders'], ARRAY['core'], ARRAY['bodyweight', 'ground']::equipment_type[], 'intermediate', 'push',
  '/exercises/push-up.jpg', '/exercises/push-up.gif', '/exercises/push-up.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'diamond-push-up',
  'Flexion diamante', 'Diamond Push-Up',
  'Flexion con manos juntas formando un diamante. Mayor enfasis en triceps.',
  'Push-up with hands together forming a diamond. Greater triceps emphasis.',
  ARRAY['Forma un diamante con pulgares e indices tocandose', 'Coloca las manos bajo el pecho', 'Baja manteniendo codos pegados al cuerpo', 'Empuja hacia arriba sin separar los codos'],
  ARRAY['Form a diamond with thumbs and index fingers touching', 'Place hands under your chest', 'Lower keeping elbows close to body', 'Push up without flaring elbows'],
  ARRAY['triceps', 'chest'], ARRAY['shoulders', 'core'], ARRAY['bodyweight', 'ground']::equipment_type[], 'intermediate', 'push',
  '/exercises/diamond-push-up.jpg', '/exercises/diamond-push-up.gif', '/exercises/diamond-push-up.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'decline-push-up',
  'Flexion declinada', 'Decline Push-Up',
  'Flexion con pies elevados. Mayor intensidad en el pectoral superior.',
  'Push-up with elevated feet. Greater upper chest intensity.',
  ARRAY['Apoya los pies en un muro o superficie elevada', 'Manos al ancho de hombros en el suelo', 'Baja el pecho hasta casi tocar el suelo', 'Empuja hacia arriba manteniendo el cuerpo recto'],
  ARRAY['Place feet on a wall or elevated surface', 'Hands shoulder-width on the ground', 'Lower chest until nearly touching ground', 'Push up keeping body straight'],
  ARRAY['chest', 'shoulders'], ARRAY['triceps', 'core'], ARRAY['bodyweight', 'ground', 'wall']::equipment_type[], 'intermediate', 'push',
  '/exercises/decline-push-up.jpg', '/exercises/decline-push-up.gif', '/exercises/decline-push-up.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'pike-push-up',
  'Flexion en pica', 'Pike Push-Up',
  'Flexion con cadera elevada. Prepara para la flexion vertical y handstand.',
  'Push-up with hips high. Prepares for vertical push and handstand.',
  ARRAY['Colocate en V invertida con manos y pies en el suelo', 'Cabeza alineada con los brazos', 'Flexiona codos bajando la coronilla hacia el suelo', 'Empuja hacia arriba manteniendo la cadera alta'],
  ARRAY['Start in inverted V, hands and feet on ground', 'Head aligned with arms', 'Bend elbows, lowering the crown of your head toward ground', 'Push up keeping hips high'],
  ARRAY['shoulders', 'triceps'], ARRAY['chest', 'core'], ARRAY['bodyweight', 'ground']::equipment_type[], 'advanced', 'push',
  '/exercises/pike-push-up.jpg', '/exercises/pike-push-up.gif', '/exercises/pike-push-up.mp4'
);

-- ============================================================================
-- PULL (6)
-- ============================================================================

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'incline-row',
  'Remo inclinado en barra', 'Incline Row',
  'Remo horizontal en barra baja. Accesible para quienes aun no hacen dominadas.',
  'Horizontal row on a low bar. Accessible for those not yet doing pull-ups.',
  ARRAY['Busca una barra a la altura de la cadera', 'Sujetate con manos al ancho de hombros', 'Cuelgate con piernas extendidas y talones en el suelo', 'Tira del pecho hacia la barra'],
  ARRAY['Find a bar at hip height', 'Grip at shoulder width', 'Hang with legs extended and heels on ground', 'Pull chest toward the bar'],
  ARRAY['back', 'biceps'], ARRAY['core'], ARRAY['bodyweight', 'bar']::equipment_type[], 'beginner', 'pull',
  '/exercises/incline-row.jpg', '/exercises/incline-row.gif', '/exercises/incline-row.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'australian-pull-up',
  'Dominada australiana', 'Australian Pull-Up',
  'Remo con cuerpo suspendido bajo una barra. Conocido como inverted row.',
  'Body row suspended under a bar. Known as inverted row.',
  ARRAY['Sujeta una barra a la altura del pecho con manos anchas', 'Cuelgate con cuerpo recto y talones apoyados', 'Tira del pecho hacia la barra', 'Baja controladamente'],
  ARRAY['Grip a chest-height bar with wide hands', 'Hang with straight body, heels on ground', 'Pull chest to bar', 'Lower with control'],
  ARRAY['back', 'biceps', 'rear-delts'], ARRAY['core', 'forearms'], ARRAY['bodyweight', 'bar']::equipment_type[], 'beginner', 'pull',
  '/exercises/australian-pull-up.jpg', '/exercises/australian-pull-up.gif', '/exercises/australian-pull-up.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'chin-up',
  'Dominada supina', 'Chin-Up',
  'Dominada con palmas hacia ti. Mayor enfasis en biceps que la dominada normal.',
  'Pull-up with palms facing you. Greater biceps emphasis than standard pull-up.',
  ARRAY['Cuelgate de la barra con palmas hacia ti', 'Manos al ancho de hombros', 'Tira hacia arriba hasta que el menton pase la barra', 'Baja controladamente hasta extension completa'],
  ARRAY['Hang from bar with palms facing you', 'Hands at shoulder width', 'Pull up until chin clears the bar', 'Lower with control to full extension'],
  ARRAY['biceps', 'back'], ARRAY['core', 'forearms'], ARRAY['bodyweight', 'bar']::equipment_type[], 'intermediate', 'pull',
  '/exercises/chin-up.jpg', '/exercises/chin-up.gif', '/exercises/chin-up.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'pull-up',
  'Dominada', 'Pull-Up',
  'Ejercicio fundamental de traccion. Trabaja dorsal, biceps y core.',
  'Fundamental pulling exercise. Works lats, biceps and core.',
  ARRAY['Cuelgate de la barra con palmas hacia adelante', 'Manos mas anchas que los hombros', 'Tira hacia arriba hasta que el menton pase la barra', 'Baja controladamente sin balanceo'],
  ARRAY['Hang from bar with palms facing away', 'Hands wider than shoulders', 'Pull up until chin clears the bar', 'Lower with control without swinging'],
  ARRAY['back', 'biceps'], ARRAY['core', 'shoulders', 'forearms'], ARRAY['bodyweight', 'bar']::equipment_type[], 'intermediate', 'pull',
  '/exercises/pull-up.jpg', '/exercises/pull-up.gif', '/exercises/pull-up.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'archer-pull-up',
  'Dominada arquera', 'Archer Pull-Up',
  'Dominada hacia un lado. Progresion hacia la dominada a un brazo.',
  'Pull-up shifting to one side. Progression toward one-arm pull-up.',
  ARRAY['Cuelgate con manos mas anchas que los hombros', 'Tira hacia un lado extendiendo el brazo contrario', 'El menton debe llegar a una mano', 'Alterna lados en cada repeticion'],
  ARRAY['Hang with hands wider than shoulders', 'Pull to one side extending the opposite arm', 'Chin should reach one hand', 'Alternate sides each rep'],
  ARRAY['back', 'biceps'], ARRAY['core', 'shoulders'], ARRAY['bodyweight', 'bar']::equipment_type[], 'advanced', 'pull',
  '/exercises/archer-pull-up.jpg', '/exercises/archer-pull-up.gif', '/exercises/archer-pull-up.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'muscle-up',
  'Muscle-Up', 'Muscle-Up',
  'Transicion explosiva de dominada a fondo. Ejercicio iconico de calistenia.',
  'Explosive transition from pull-up to dip. Iconic calisthenics exercise.',
  ARRAY['Cuelgate de la barra con manos al ancho de hombros', 'Balancea ligeramente y tira explosivamente', 'Transiciona llevando el pecho sobre la barra', 'Extiende los brazos hasta quedar arriba de la barra'],
  ARRAY['Hang from bar at shoulder width', 'Swing slightly and pull explosively', 'Transition by bringing chest over the bar', 'Extend arms until you are on top of the bar'],
  ARRAY['back', 'chest', 'triceps'], ARRAY['shoulders', 'core'], ARRAY['bodyweight', 'bar']::equipment_type[], 'advanced', 'pull',
  '/exercises/muscle-up.jpg', '/exercises/muscle-up.gif', '/exercises/muscle-up.mp4'
);

-- ============================================================================
-- CORE (5)
-- ============================================================================

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'dead-bug',
  'Dead Bug', 'Dead Bug',
  'Ejercicio de control lumbo-pelvico. Enseña a estabilizar la zona media.',
  'Lumbo-pelvic control exercise. Teaches core stabilization.',
  ARRAY['Acostado boca arriba, brazos hacia el techo', 'Piernas en posicion de mesa a 90 grados', 'Extiende lentamente brazo derecho y pierna izquierda', 'Vuelve al centro y alterna lados'],
  ARRAY['Lie on your back, arms toward ceiling', 'Legs in tabletop position at 90 degrees', 'Slowly extend right arm and left leg', 'Return to center and alternate sides'],
  ARRAY['core'], ARRAY['hip-flexors'], ARRAY['bodyweight', 'ground']::equipment_type[], 'beginner', 'core',
  '/exercises/dead-bug.jpg', '/exercises/dead-bug.gif', '/exercises/dead-bug.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'plank',
  'Plancha', 'Plank',
  'Ejercicio isometrico de core. Fortalece toda la faja abdominal.',
  'Isometric core exercise. Strengthens the entire abdominal wall.',
  ARRAY['Colocate boca abajo apoyado en antebrazos y puntas de pies', 'Cuerpo en linea recta de pies a cabeza', 'Contrae el core y gluteos', 'Manten la posicion sin arquear la espalda'],
  ARRAY['Lie face down supported on forearms and toes', 'Body in a straight line from head to feet', 'Squeeze core and glutes', 'Hold position without arching your back'],
  ARRAY['core'], ARRAY['shoulders', 'glutes'], ARRAY['bodyweight', 'ground']::equipment_type[], 'beginner', 'core',
  '/exercises/plank.jpg', '/exercises/plank.gif', '/exercises/plank.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'hollow-body-hold',
  'Hollow Body Hold', 'Hollow Body Hold',
  'Posicion de tension corporal total. Fundamento de gimnasia y calistenia.',
  'Total body tension position. Gymnastics and calisthenics foundation.',
  ARRAY['Acostado boca arriba, brazos extendidos detras de la cabeza', 'Eleva piernas y hombros del suelo', 'Zona lumbar pegada al suelo', 'Manten la posicion en forma de cuchara'],
  ARRAY['Lie on your back, arms extended overhead', 'Lift legs and shoulders off the ground', 'Lower back pressed into the ground', 'Hold the hollow spoon shape'],
  ARRAY['core'], ARRAY['hip-flexors', 'quads'], ARRAY['bodyweight', 'ground']::equipment_type[], 'beginner', 'core',
  '/exercises/hollow-body-hold.jpg', '/exercises/hollow-body-hold.gif', '/exercises/hollow-body-hold.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'hanging-leg-raise',
  'Elevacion de piernas colgado', 'Hanging Leg Raise',
  'Ejercicio de core colgado de la barra. Trabaja el abdomen inferior intensamente.',
  'Core exercise hanging from the bar. Intensely works lower abs.',
  ARRAY['Cuelgate de la barra con manos al ancho de hombros', 'Piernas extendidas', 'Eleva las piernas rectas hasta la altura de la cadera', 'Baja controladamente sin balanceo'],
  ARRAY['Hang from bar, hands shoulder-width', 'Legs extended', 'Raise straight legs to hip height', 'Lower with control without swinging'],
  ARRAY['core'], ARRAY['hip-flexors', 'shoulders', 'grip'], ARRAY['bodyweight', 'bar']::equipment_type[], 'intermediate', 'core',
  '/exercises/hanging-leg-raise.jpg', '/exercises/hanging-leg-raise.gif', '/exercises/hanging-leg-raise.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'dragon-flag',
  'Dragon Flag', 'Dragon Flag',
  'Ejercicio avanzado de core. Bajada controlada con el cuerpo recto desde los hombros.',
  'Advanced core exercise. Controlled descent with straight body from shoulders.',
  ARRAY['Sujeta un poste o barra detras de la cabeza', 'Eleva el cuerpo recto hasta la vertical sobre los hombros', 'Baja el cuerpo manteniendolo completamente recto', 'Frena justo antes de tocar el suelo y repite'],
  ARRAY['Grip a pole or bar behind your head', 'Raise body straight to vertical on your shoulders', 'Lower your body keeping it completely straight', 'Stop just before touching ground and repeat'],
  ARRAY['core'], ARRAY['back', 'shoulders', 'glutes'], ARRAY['bodyweight', 'ground', 'bar']::equipment_type[], 'advanced', 'core',
  '/exercises/dragon-flag.jpg', '/exercises/dragon-flag.gif', '/exercises/dragon-flag.mp4'
);

-- ============================================================================
-- LEGS (6)
-- ============================================================================

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'bodyweight-squat',
  'Sentadilla corporal', 'Bodyweight Squat',
  'Ejercicio fundamental de piernas. Movimiento natural del cuerpo humano.',
  'Fundamental leg exercise. Natural human movement pattern.',
  ARRAY['Pies al ancho de hombros, puntas ligeramente hacia afuera', 'Brazos extendidos al frente', 'Desciende llevando la cadera hacia atras', 'Baja hasta que los muslos esten paralelos al suelo', 'Empuja hacia arriba desde los talones'],
  ARRAY['Feet shoulder-width, toes slightly out', 'Arms extended forward', 'Descend by pushing hips back', 'Lower until thighs are parallel to ground', 'Push up from your heels'],
  ARRAY['quads', 'glutes', 'hamstrings'], ARRAY['core', 'calves'], ARRAY['bodyweight', 'ground']::equipment_type[], 'beginner', 'legs',
  '/exercises/bodyweight-squat.jpg', '/exercises/bodyweight-squat.gif', '/exercises/bodyweight-squat.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'wall-sit',
  'Sentadilla isometrica en pared', 'Wall Sit',
  'Ejercicio isometrico de piernas contra la pared. Resistencia y quema.',
  'Isometric leg exercise against a wall. Endurance and burn.',
  ARRAY['Apoya la espalda contra una pared', 'Desciende hasta que las rodillas formen 90 grados', 'Manten la posicion sin apoyar las manos en las piernas', 'Resiste el mayor tiempo posible'],
  ARRAY['Lean your back against a wall', 'Slide down until knees form 90 degrees', 'Hold position without resting hands on legs', 'Hold for as long as possible'],
  ARRAY['quads', 'glutes'], ARRAY['core'], ARRAY['bodyweight', 'wall']::equipment_type[], 'beginner', 'legs',
  '/exercises/wall-sit.jpg', '/exercises/wall-sit.gif', '/exercises/wall-sit.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'reverse-lunge',
  'Zancada inversa', 'Reverse Lunge',
  'Paso hacia atras flexionando ambas rodillas. Unilateral, trabaja equilibrio.',
  'Step back bending both knees. Unilateral, works balance.',
  ARRAY['De pie, manos en la cadera', 'Da un paso hacia atras con una pierna', 'Flexiona ambas rodillas hasta 90 grados', 'La rodilla trasera casi toca el suelo', 'Empuja hacia arriba y vuelve a la posicion inicial'],
  ARRAY['Stand, hands on hips', 'Step back with one leg', 'Bend both knees to 90 degrees', 'Back knee nearly touches ground', 'Push up and return to starting position'],
  ARRAY['quads', 'glutes', 'hamstrings'], ARRAY['core'], ARRAY['bodyweight', 'ground']::equipment_type[], 'beginner', 'legs',
  '/exercises/reverse-lunge.jpg', '/exercises/reverse-lunge.gif', '/exercises/reverse-lunge.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'bulgarian-split-squat',
  'Sentadilla bulgara', 'Bulgarian Split Squat',
  'Sentadilla unilateral con pie trasero elevado en muro o banco.',
  'Unilateral squat with back foot elevated on wall or bench.',
  ARRAY['Coloca el empeine trasero sobre un muro bajo o superficie elevada', 'Da un paso adelante con la pierna delantera', 'Baja flexionando la rodilla delantera', 'Manten el torso erguido', 'Empuja hacia arriba desde el talon delantero'],
  ARRAY['Place back instep on a low wall or elevated surface', 'Step forward with front leg', 'Lower by bending front knee', 'Keep torso upright', 'Push up from front heel'],
  ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'core'], ARRAY['bodyweight', 'ground', 'wall']::equipment_type[], 'beginner', 'legs',
  '/exercises/bulgarian-split-squat.jpg', '/exercises/bulgarian-split-squat.gif', '/exercises/bulgarian-split-squat.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'jump-squat',
  'Sentadilla con salto', 'Jump Squat',
  'Sentadilla explosiva con salto. Trabaja potencia en piernas.',
  'Explosive squat with jump. Works leg power.',
  ARRAY['Comienza en posicion de sentadilla', 'Baja hasta un cuarto de profundidad', 'Explota hacia arriba saltando lo mas alto posible', 'Aterriza suavemente con rodillas flexionadas', 'Encadena directamente a la siguiente repeticion'],
  ARRAY['Start in squat position', 'Lower to quarter depth', 'Explode upward jumping as high as possible', 'Land softly with bent knees', 'Chain directly into the next rep'],
  ARRAY['quads', 'glutes', 'calves'], ARRAY['core'], ARRAY['bodyweight', 'ground']::equipment_type[], 'intermediate', 'legs',
  '/exercises/jump-squat.jpg', '/exercises/jump-squat.gif', '/exercises/jump-squat.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'pistol-squat',
  'Pistol Squat', 'Pistol Squat',
  'Sentadilla a una pierna. Fuerza unilateral maxima con el peso del cuerpo.',
  'One-legged squat. Maximum unilateral bodyweight strength.',
  ARRAY['De pie sobre una pierna, la otra extendida al frente', 'Brazos al frente para equilibrio', 'Baja controladamente sobre una pierna', 'Manten la pierna libre sin tocar el suelo', 'Llega al punto mas bajo y empuja hacia arriba'],
  ARRAY['Stand on one leg, the other extended forward', 'Arms forward for balance', 'Lower with control on one leg', 'Keep free leg off the ground', 'Reach the lowest point and push up'],
  ARRAY['quads', 'glutes', 'hamstrings'], ARRAY['core', 'calves'], ARRAY['bodyweight', 'ground']::equipment_type[], 'advanced', 'legs',
  '/exercises/pistol-squat.jpg', '/exercises/pistol-squat.gif', '/exercises/pistol-squat.mp4'
);

-- ============================================================================
-- CARDIO (4)
-- ============================================================================

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'high-knees',
  'Rodillas al pecho', 'High Knees',
  'Ejercicio cardiovascular en el lugar. Eleva el ritmo cardiaco rapidamente.',
  'Cardiovascular exercise in place. Quickly elevates heart rate.',
  ARRAY['De pie, comienza a trotar en el lugar', 'Eleva las rodillas lo mas alto posible', 'Mantene un ritmo rapido y constante', 'Bombea los brazos coordinados con las piernas'],
  ARRAY['Stand, start jogging in place', 'Lift knees as high as possible', 'Keep a fast, steady pace', 'Pump arms coordinated with legs'],
  ARRAY['quads', 'hip-flexors'], ARRAY['core', 'calves'], ARRAY['bodyweight', 'ground']::equipment_type[], 'beginner', 'cardio',
  '/exercises/high-knees.jpg', '/exercises/high-knees.gif', '/exercises/high-knees.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'burpee',
  'Burpee', 'Burpee',
  'Ejercicio de cuerpo completo con componente cardiovascular intenso.',
  'Full-body exercise with intense cardiovascular component.',
  ARRAY['De pie, baja las manos al suelo y patea las piernas hacia atras', 'Haz una flexion', 'Recoge las piernas hacia las manos', 'Salta explosivamente con brazos hacia arriba', 'Repite sin pausa'],
  ARRAY['Stand, drop hands to ground and kick legs back', 'Do one push-up', 'Bring legs back toward hands', 'Jump explosively with arms up', 'Repeat without pause'],
  ARRAY['quads', 'chest', 'shoulders'], ARRAY['core', 'calves'], ARRAY['bodyweight', 'ground']::equipment_type[], 'intermediate', 'cardio',
  '/exercises/burpee.jpg', '/exercises/burpee.gif', '/exercises/burpee.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'mountain-climbers',
  'Escaladores', 'Mountain Climbers',
  'Cardio en plancha alternando rodillas al pecho. Alta intensidad.',
  'Plank cardio alternating knees to chest. High intensity.',
  ARRAY['Colocate en plancha alta con manos bajo los hombros', 'Lleva una rodilla al pecho rapidamente', 'Alterna las piernas sin parar', 'Manten la cadera baja y el core firme'],
  ARRAY['Start in high plank, hands under shoulders', 'Bring one knee to chest quickly', 'Alternate legs without stopping', 'Keep hips low and core tight'],
  ARRAY['core', 'hip-flexors'], ARRAY['shoulders', 'quads'], ARRAY['bodyweight', 'ground']::equipment_type[], 'intermediate', 'cardio',
  '/exercises/mountain-climbers.jpg', '/exercises/mountain-climbers.gif', '/exercises/mountain-climbers.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'dumbbell-farmers-walk',
  'Caminata de granjero con mancuerna', 'Dumbbell Farmer''s Walk',
  'Caminata cargando mancuernas. Trabaja agarre, core y acondicionamiento.',
  'Loaded carry with dumbbells. Works grip, core and conditioning.',
  ARRAY['Sujeta una mancuerna en cada mano', 'Brazos extendidos a los costados', 'Camina con pasos cortos y controlados', 'Manten los hombros hacia atras y el core firme', 'Recorre una distancia determinada sin soltar'],
  ARRAY['Hold a dumbbell in each hand', 'Arms extended at your sides', 'Walk with short, controlled steps', 'Keep shoulders back and core tight', 'Cover a set distance without letting go'],
  ARRAY['forearms', 'core', 'traps'], ARRAY['shoulders', 'glutes'], ARRAY['bodyweight', 'dumbbell']::equipment_type[], 'beginner', 'cardio',
  '/exercises/dumbbell-farmers-walk.jpg', '/exercises/dumbbell-farmers-walk.gif', '/exercises/dumbbell-farmers-walk.mp4'
);

-- ============================================================================
-- MOBILITY (3)
-- ============================================================================

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'cat-cow-stretch',
  'Estiramiento gato-vaca', 'Cat-Cow Stretch',
  'Movilidad de columna en cuatro puntos. Excelente para calentamiento.',
  'Spine mobility on all fours. Excellent for warm-up.',
  ARRAY['Colocate en cuatro puntos sobre el suelo', 'Inhala arqueando la espalda hacia abajo (vaca)', 'Exhala redondeando la espalda hacia arriba (gato)', 'Movimiento lento y fluido sincronizado con la respiracion'],
  ARRAY['Start on all fours on the ground', 'Inhale arching your back down (cow)', 'Exhale rounding your back up (cat)', 'Slow, fluid movement synchronized with breathing'],
  ARRAY['spine', 'core'], ARRAY['shoulders'], ARRAY['bodyweight', 'ground']::equipment_type[], 'beginner', 'mobility',
  '/exercises/cat-cow-stretch.jpg', '/exercises/cat-cow-stretch.gif', '/exercises/cat-cow-stretch.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'worlds-greatest-stretch',
  'El mejor estiramiento del mundo', 'World''s Greatest Stretch',
  'Estiramiento integral que moviliza cadera, columna y hombros.',
  'Comprehensive stretch mobilizing hips, spine and shoulders.',
  ARRAY['Parte de posicion de zancada baja con una pierna adelantada', 'Apoya la mano del mismo lado del pie adelantado en el suelo', 'Gira el torso hacia el lado de la pierna adelantada', 'Extiende el brazo libre hacia el cielo', 'Manten 5 respiraciones y cambia de lado'],
  ARRAY['Start in low lunge with one leg forward', 'Place same-side hand on the ground', 'Rotate torso toward the forward leg', 'Extend free arm toward the sky', 'Hold 5 breaths and switch sides'],
  ARRAY['hips', 'spine', 'shoulders'], ARRAY['core'], ARRAY['bodyweight', 'ground']::equipment_type[], 'beginner', 'mobility',
  '/exercises/worlds-greatest-stretch.jpg', '/exercises/worlds-greatest-stretch.gif', '/exercises/worlds-greatest-stretch.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'shoulder-pass-through',
  'Pasada de hombros con barra', 'Shoulder Pass-Through',
  'Movilidad de hombros con una barra o palo. Abre el pecho y libera tension.',
  'Shoulder mobility with a bar or stick. Opens chest and releases tension.',
  ARRAY['Sujeta una barra o palo con ambas manos bien abiertas', 'Brazos extendidos al frente', 'Lleva la barra por encima de la cabeza y hacia atras', 'Llega lo mas atras que puedas sin dolor', 'Vuelve lentamente al frente'],
  ARRAY['Hold a bar or stick with both hands wide', 'Arms extended in front', 'Bring the bar overhead and behind you', 'Go as far back as you can without pain', 'Slowly return to the front'],
  ARRAY['shoulders', 'chest'], ARRAY['back'], ARRAY['bodyweight', 'bar']::equipment_type[], 'beginner', 'mobility',
  '/exercises/shoulder-pass-through.jpg', '/exercises/shoulder-pass-through.gif', '/exercises/shoulder-pass-through.mp4'
);

-- ============================================================================
-- SKILL (3)
-- ============================================================================

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'crow-pose',
  'Postura del cuervo', 'Crow Pose',
  'Equilibrio sobre las manos con rodillas apoyadas en los codos. Puerta de entrada a los handstands.',
  'Hand balance with knees on elbows. Gateway to handstands.',
  ARRAY['Colocate en cuclillas con manos en el suelo', 'Apoya las rodillas en la parte trasera de los brazos', 'Inclinate hacia adelante transfiriendo peso a las manos', 'Eleva los pies del suelo', 'Manten el equilibrio con la mirada al frente'],
  ARRAY['Squat with hands on the ground', 'Rest knees on the back of your arms', 'Lean forward shifting weight onto your hands', 'Lift feet off the ground', 'Hold balance looking forward'],
  ARRAY['shoulders', 'core'], ARRAY['wrists', 'triceps'], ARRAY['bodyweight', 'ground']::equipment_type[], 'intermediate', 'skill',
  '/exercises/crow-pose.jpg', '/exercises/crow-pose.gif', '/exercises/crow-pose.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'wall-handstand-hold',
  'Parada de manos con apoyo en pared', 'Wall Handstand Hold',
  'Handstand asistido contra la pared. Desarrolla fuerza de hombros y control invertido.',
  'Wall-assisted handstand. Builds shoulder strength and inverted control.',
  ARRAY['Colocate de cara a la pared a un metro de distancia', 'Apoya las manos en el suelo y sube una pierna a la pared', 'Sube la otra pierna hasta quedar en posicion vertical', 'Cuerpo recto, brazos bloqueados', 'Manten la posicion mirando a las manos'],
  ARRAY['Stand facing the wall, one meter away', 'Place hands on ground and kick one leg up to wall', 'Bring other leg up until vertical', 'Straight body, locked arms', 'Hold position looking at your hands'],
  ARRAY['shoulders', 'core'], ARRAY['wrists', 'back'], ARRAY['bodyweight', 'wall']::equipment_type[], 'advanced', 'skill',
  '/exercises/wall-handstand-hold.jpg', '/exercises/wall-handstand-hold.gif', '/exercises/wall-handstand-hold.mp4'
);

INSERT INTO exercises (slug, name_es, name_en, description_es, description_en, instructions_es, instructions_en, muscle_groups, secondary_muscles, equipment_required, difficulty, category, image_url, gif_url, video_url)
VALUES (
  'front-lever-progression',
  'Front Lever (progresion)', 'Front Lever Progression',
  'Progresion hacia el front lever colgado de la barra. Cuerpo horizontal al suelo.',
  'Progression toward front lever hanging from bar. Body horizontal to ground.',
  ARRAY['Cuelgate de la barra con manos al ancho de hombros', 'Comienza con las piernas recogidas (tuck)', 'Extiende progresivamente las piernas segun tu nivel', 'Manten el cuerpo horizontal y la mirada al frente', 'Baja controladamente cuando pierdas la posicion'],
  ARRAY['Hang from bar, hands shoulder-width', 'Start with legs tucked (tuck)', 'Progressively extend legs according to your level', 'Keep body horizontal and eyes forward', 'Lower with control when you lose position'],
  ARRAY['back', 'core', 'shoulders'], ARRAY['forearms', 'glutes'], ARRAY['bodyweight', 'bar']::equipment_type[], 'advanced', 'skill',
  '/exercises/front-lever-progression.jpg', '/exercises/front-lever-progression.gif', '/exercises/front-lever-progression.mp4'
);
