import type { Locale } from '@mycoach/i18n'
import type {
  BodyAnalysis,
  BodyArea,
  Equipment,
  Exercise,
  MuscleGroup,
  SessionMinutes,
  WorkoutDay,
  WorkoutPlan,
} from '../schemas'
import type { PlanInputs } from '../types'

/**
 * A deterministic, rules-based plan. Used by the mock AI provider (local dev, tests) and as a
 * sensible reference for what a generated plan should look like. Pure: same inputs → same plan.
 */

type Pattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'h_push'
  | 'v_push'
  | 'h_pull'
  | 'v_pull'
  | 'lateral'
  | 'biceps'
  | 'triceps'
  | 'glute'
  | 'calf'
  | 'core'

type Name = Record<Locale, string>

const EXERCISES: Record<Pattern, { muscle: MuscleGroup; byEquipment: Record<Equipment, Name> }> = {
  squat: {
    muscle: 'quads',
    byEquipment: {
      full_gym: { en: 'Barbell back squat', 'pt-BR': 'Agachamento livre com barra' },
      home_dumbbells: { en: 'Goblet squat', 'pt-BR': 'Agachamento goblet com halter' },
      bodyweight: { en: 'Bodyweight squat', 'pt-BR': 'Agachamento livre' },
    },
  },
  hinge: {
    muscle: 'hamstrings',
    byEquipment: {
      full_gym: { en: 'Romanian deadlift', 'pt-BR': 'Levantamento terra romeno' },
      home_dumbbells: { en: 'Dumbbell Romanian deadlift', 'pt-BR': 'Terra romeno com halteres' },
      bodyweight: { en: 'Single-leg hip hinge', 'pt-BR': 'Stiff unilateral sem peso' },
    },
  },
  lunge: {
    muscle: 'quads',
    byEquipment: {
      full_gym: { en: 'Leg press', 'pt-BR': 'Leg press 45°' },
      home_dumbbells: { en: 'Dumbbell reverse lunge', 'pt-BR': 'Afundo reverso com halteres' },
      bodyweight: { en: 'Reverse lunge', 'pt-BR': 'Afundo reverso' },
    },
  },
  h_push: {
    muscle: 'chest',
    byEquipment: {
      full_gym: { en: 'Barbell bench press', 'pt-BR': 'Supino reto com barra' },
      home_dumbbells: { en: 'Dumbbell floor press', 'pt-BR': 'Supino no chão com halteres' },
      bodyweight: { en: 'Push-up', 'pt-BR': 'Flexão de braço' },
    },
  },
  v_push: {
    muscle: 'shoulders',
    byEquipment: {
      full_gym: { en: 'Seated dumbbell shoulder press', 'pt-BR': 'Desenvolvimento com halteres' },
      home_dumbbells: { en: 'Dumbbell shoulder press', 'pt-BR': 'Desenvolvimento com halteres' },
      bodyweight: { en: 'Pike push-up', 'pt-BR': 'Flexão pike' },
    },
  },
  h_pull: {
    muscle: 'back',
    byEquipment: {
      full_gym: { en: 'Seated cable row', 'pt-BR': 'Remada baixa no cabo' },
      home_dumbbells: { en: 'One-arm dumbbell row', 'pt-BR': 'Remada unilateral com halter' },
      bodyweight: { en: 'Inverted row (table)', 'pt-BR': 'Remada invertida (na mesa)' },
    },
  },
  v_pull: {
    muscle: 'back',
    byEquipment: {
      full_gym: { en: 'Lat pulldown', 'pt-BR': 'Puxada frontal' },
      home_dumbbells: { en: 'Dumbbell pullover', 'pt-BR': 'Pullover com halter' },
      bodyweight: { en: 'Superman pull', 'pt-BR': 'Puxada superman no chão' },
    },
  },
  lateral: {
    muscle: 'shoulders',
    byEquipment: {
      full_gym: { en: 'Cable lateral raise', 'pt-BR': 'Elevação lateral no cabo' },
      home_dumbbells: { en: 'Dumbbell lateral raise', 'pt-BR': 'Elevação lateral com halteres' },
      bodyweight: { en: 'Plank shoulder taps', 'pt-BR': 'Prancha com toque no ombro' },
    },
  },
  biceps: {
    muscle: 'biceps',
    byEquipment: {
      full_gym: { en: 'EZ-bar curl', 'pt-BR': 'Rosca direta com barra W' },
      home_dumbbells: { en: 'Dumbbell curl', 'pt-BR': 'Rosca alternada com halteres' },
      bodyweight: { en: 'Towel curl (isometric)', 'pt-BR': 'Rosca isométrica com toalha' },
    },
  },
  triceps: {
    muscle: 'triceps',
    byEquipment: {
      full_gym: { en: 'Cable triceps pushdown', 'pt-BR': 'Tríceps na polia' },
      home_dumbbells: { en: 'Overhead dumbbell extension', 'pt-BR': 'Tríceps francês com halter' },
      bodyweight: { en: 'Bench dip', 'pt-BR': 'Mergulho no banco' },
    },
  },
  glute: {
    muscle: 'glutes',
    byEquipment: {
      full_gym: { en: 'Barbell hip thrust', 'pt-BR': 'Elevação pélvica com barra' },
      home_dumbbells: { en: 'Dumbbell hip thrust', 'pt-BR': 'Elevação pélvica com halter' },
      bodyweight: { en: 'Glute bridge', 'pt-BR': 'Ponte de glúteos' },
    },
  },
  calf: {
    muscle: 'calves',
    byEquipment: {
      full_gym: { en: 'Standing calf raise', 'pt-BR': 'Panturrilha em pé na máquina' },
      home_dumbbells: { en: 'Dumbbell calf raise', 'pt-BR': 'Panturrilha em pé com halteres' },
      bodyweight: { en: 'Single-leg calf raise', 'pt-BR': 'Panturrilha unilateral' },
    },
  },
  core: {
    muscle: 'core',
    byEquipment: {
      full_gym: { en: 'Cable crunch', 'pt-BR': 'Abdominal na polia' },
      home_dumbbells: { en: 'Dead bug', 'pt-BR': 'Dead bug' },
      bodyweight: { en: 'Plank', 'pt-BR': 'Prancha' },
    },
  },
}

type DayKind = 'full_a' | 'full_b' | 'full_c' | 'upper' | 'lower' | 'push' | 'pull' | 'legs'

/** Movement patterns per day, most important first; sessions take as many as time allows. */
const DAY_PATTERNS: Record<DayKind, Pattern[]> = {
  full_a: ['squat', 'h_push', 'h_pull', 'hinge', 'lateral', 'core', 'biceps', 'calf'],
  full_b: ['hinge', 'v_push', 'v_pull', 'lunge', 'glute', 'triceps', 'core', 'calf'],
  full_c: ['lunge', 'h_push', 'v_pull', 'glute', 'lateral', 'biceps', 'triceps', 'core'],
  upper: ['h_push', 'h_pull', 'v_push', 'v_pull', 'lateral', 'biceps', 'triceps', 'core'],
  lower: ['squat', 'hinge', 'lunge', 'glute', 'calf', 'core', 'squat', 'hinge'],
  push: ['h_push', 'v_push', 'lateral', 'triceps', 'h_push', 'core', 'lateral', 'triceps'],
  pull: ['v_pull', 'h_pull', 'biceps', 'h_pull', 'lateral', 'core', 'v_pull', 'biceps'],
  legs: ['squat', 'hinge', 'lunge', 'glute', 'calf', 'core', 'lunge', 'calf'],
}

export function splitFor(
  daysPerWeek: number,
  experience: PlanInputs['questionnaire']['experience'],
): DayKind[] {
  switch (daysPerWeek) {
    case 2:
      return ['full_a', 'full_b']
    case 3:
      return experience === 'beginner' ? ['full_a', 'full_b', 'full_c'] : ['push', 'pull', 'legs']
    case 4:
      return ['upper', 'lower', 'upper', 'lower']
    case 5:
      return ['upper', 'lower', 'push', 'pull', 'legs']
    default:
      return ['push', 'pull', 'legs', 'push', 'pull', 'legs']
  }
}

export function exercisesPerSession(minutes: SessionMinutes): number {
  return { 30: 4, 45: 5, 60: 6, 75: 7, 90: 8 }[minutes]
}

const AREA_MUSCLES: Record<BodyArea, MuscleGroup[]> = {
  chest: ['chest'],
  back: ['back'],
  shoulders: ['shoulders'],
  arms: ['biceps', 'triceps'],
  core: ['core'],
  glutes: ['glutes'],
  legs: ['quads', 'hamstrings'],
  calves: ['calves'],
  posture: ['back', 'core'],
}

const COPY: Record<
  Locale,
  {
    day: Record<DayKind, { title: string; focus: string }>
    dayPrefix: (n: number) => string
    warmup: string
    cooldown: string
    name: Record<NonNullable<PlanInputs['goal']> | 'none', string>
    summary: (days: number, minutes: number) => string
    progression: string
    tips: string[]
    priorityNote: string
  }
> = {
  en: {
    day: {
      full_a: { title: 'Full body A', focus: 'Squat, push and pull basics' },
      full_b: { title: 'Full body B', focus: 'Hinge, overhead press and vertical pull' },
      full_c: { title: 'Full body C', focus: 'Single-leg work, chest and back' },
      upper: { title: 'Upper body', focus: 'Chest, back, shoulders and arms' },
      lower: { title: 'Lower body', focus: 'Quads, hamstrings, glutes and calves' },
      push: { title: 'Push', focus: 'Chest, shoulders and triceps' },
      pull: { title: 'Pull', focus: 'Back and biceps' },
      legs: { title: 'Legs', focus: 'Quads, hamstrings, glutes and calves' },
    },
    dayPrefix: (n) => `Day ${n}`,
    warmup: '5 min easy cardio, then 2 light sets of the first exercise.',
    cooldown: '3–5 min of easy stretching for the muscles you trained.',
    name: {
      lose_fat: 'Lean & Strong',
      build_muscle: 'Muscle Builder',
      maintain: 'Strong Maintenance',
      improve_health: 'Healthy Habits',
      none: 'Foundation Plan',
    },
    summary: (days, minutes) =>
      `A ${days}-day-per-week plan with ~${minutes}-minute sessions built around compound lifts. Train each muscle about twice a week and add a little each week.`,
    progression:
      'When you hit the top of the rep range on every set, add a little weight (or a harder variation) next session. Every 5th week, do one lighter week.',
    tips: [
      'Leave 1–3 reps in reserve on most sets; never grind to failure on big lifts.',
      'Log your weights so you can beat them next time.',
      'Sleep 7–9 hours: recovery is where you get stronger.',
    ],
    priorityNote: 'Extra set: priority area.',
  },
  'pt-BR': {
    day: {
      full_a: { title: 'Corpo inteiro A', focus: 'Agachamento, empurrar e puxar' },
      full_b: { title: 'Corpo inteiro B', focus: 'Terra, desenvolvimento e puxada' },
      full_c: { title: 'Corpo inteiro C', focus: 'Unilateral, peito e costas' },
      upper: { title: 'Superiores', focus: 'Peito, costas, ombros e braços' },
      lower: { title: 'Inferiores', focus: 'Quadríceps, posteriores, glúteos e panturrilhas' },
      push: { title: 'Empurrar', focus: 'Peito, ombros e tríceps' },
      pull: { title: 'Puxar', focus: 'Costas e bíceps' },
      legs: { title: 'Pernas', focus: 'Quadríceps, posteriores, glúteos e panturrilhas' },
    },
    dayPrefix: (n) => `Dia ${n}`,
    warmup: '5 min de cardio leve e 2 séries leves do primeiro exercício.',
    cooldown: '3–5 min de alongamento leve dos músculos treinados.',
    name: {
      lose_fat: 'Definição e Força',
      build_muscle: 'Hipertrofia',
      maintain: 'Manutenção Forte',
      improve_health: 'Saúde em Dia',
      none: 'Plano Base',
    },
    summary: (days, minutes) =>
      `Um plano de ${days} dias por semana com sessões de ~${minutes} minutos, baseado em exercícios compostos. Cada músculo é treinado cerca de duas vezes por semana, com progressão semanal.`,
    progression:
      'Quando atingir o topo da faixa de repetições em todas as séries, aumente um pouco a carga (ou use uma variação mais difícil) no próximo treino. A cada 5ª semana, faça uma semana mais leve.',
    tips: [
      'Deixe 1–3 repetições de reserva na maioria das séries; não vá à falha nos exercícios pesados.',
      'Anote suas cargas para superá-las no próximo treino.',
      'Durma 7–9 horas: é na recuperação que você fica mais forte.',
    ],
    priorityNote: 'Série extra: área prioritária.',
  },
}

function prescription(
  inputs: PlanInputs,
  pattern: Pattern,
): Pick<Exercise, 'sets' | 'reps' | 'restSeconds'> {
  const { experience } = inputs.questionnaire
  const baseSets = experience === 'advanced' ? 4 : 3
  const compound = ['squat', 'hinge', 'h_push', 'v_push', 'h_pull', 'v_pull', 'lunge'].includes(
    pattern,
  )
  if (pattern === 'core') return { sets: 3, reps: '30–45 s', restSeconds: 45 }
  if (inputs.goal === 'lose_fat') {
    return { sets: baseSets, reps: compound ? '8–12' : '12–15', restSeconds: compound ? 90 : 60 }
  }
  if (inputs.goal === 'build_muscle') {
    return {
      sets: compound ? baseSets + 1 : baseSets,
      reps: compound ? '6–10' : '10–15',
      restSeconds: compound ? 120 : 75,
    }
  }
  return { sets: baseSets, reps: compound ? '8–12' : '10–15', restSeconds: compound ? 90 : 60 }
}

export function buildTemplatePlan(
  inputs: PlanInputs,
  analysis: BodyAnalysis | null = null,
): WorkoutPlan {
  const { questionnaire, locale } = inputs
  const copy = COPY[locale]
  const perSession = exercisesPerSession(questionnaire.sessionMinutes)
  const priorityMuscles = new Set(
    (analysis?.usable ? analysis.priorityAreas : []).flatMap((p) => AREA_MUSCLES[p.area]),
  )

  const days: WorkoutDay[] = splitFor(questionnaire.daysPerWeek, questionnaire.experience).map(
    (kind, index) => {
      const seen = new Set<string>()
      const exercises: Exercise[] = []
      for (const pattern of DAY_PATTERNS[kind]) {
        if (exercises.length >= perSession) break
        const { muscle, byEquipment } = EXERCISES[pattern]
        const name = byEquipment[questionnaire.equipment][locale]
        if (seen.has(name)) continue
        seen.add(name)
        const base = prescription(inputs, pattern)
        const priority = priorityMuscles.has(muscle)
        exercises.push({
          name,
          muscleGroup: muscle,
          ...base,
          sets: priority ? base.sets + 1 : base.sets,
          notes: priority ? copy.priorityNote : '',
        })
      }
      return {
        title: `${copy.dayPrefix(index + 1)} · ${copy.day[kind].title}`,
        focus: copy.day[kind].focus,
        estimatedMinutes: questionnaire.sessionMinutes,
        warmup: copy.warmup,
        exercises,
        cooldown: copy.cooldown,
      }
    },
  )

  return {
    name: copy.name[inputs.goal ?? 'none'],
    summary: copy.summary(questionnaire.daysPerWeek, questionnaire.sessionMinutes),
    durationWeeks: 8,
    progression: copy.progression,
    days,
    tips: copy.tips,
  }
}

/** Deterministic stand-in for the AI photo analysis (mock provider only). */
export function buildMockBodyAnalysis(inputs: PlanInputs): BodyAnalysis {
  const female = inputs.body?.sex === 'female'
  const pt = inputs.locale === 'pt-BR'
  return {
    usable: true,
    bodyFatPercentLow: female ? 24 : 16,
    bodyFatPercentHigh: female ? 28 : 20,
    bodyType: 'mesomorph',
    priorityAreas: [
      {
        area: 'shoulders',
        reason: pt
          ? 'Ombros mais largos equilibram a silhueta.'
          : 'Broader shoulders balance your frame.',
      },
      {
        area: 'core',
        reason: pt ? 'Um core forte protege a lombar.' : 'A strong core protects your lower back.',
      },
    ],
    postureNotes: '',
    summary: pt
      ? '(análise simulada) Boa base para começar. Vamos focar em ombros e core.'
      : '(mock analysis) A solid base to build on. We will focus on shoulders and core.',
    confidence: 'medium',
  }
}
