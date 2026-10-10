import type { BodyAnalysis, WorkoutPlan } from '../schemas'
import type { PlanInputs } from '../types'

/**
 * Business checks on AI output, applied after schema validation. The schema guarantees shape;
 * these guarantee the plan actually fits what the user asked for.
 */
export function planIssues(plan: WorkoutPlan, inputs: PlanInputs): string[] {
  const issues: string[] = []
  const { daysPerWeek, sessionMinutes } = inputs.questionnaire

  if (plan.days.length !== daysPerWeek) {
    issues.push(`expected ${daysPerWeek} days, got ${plan.days.length}`)
  }
  if (plan.durationWeeks < 2 || plan.durationWeeks > 16) {
    issues.push(`durationWeeks out of range: ${plan.durationWeeks}`)
  }
  plan.days.forEach((day, d) => {
    if (day.exercises.length < 2 || day.exercises.length > 12) {
      issues.push(`day ${d + 1}: ${day.exercises.length} exercises`)
    }
    if (day.estimatedMinutes > sessionMinutes * 1.5) {
      issues.push(
        `day ${d + 1}: ${day.estimatedMinutes} min exceeds ${sessionMinutes} min sessions`,
      )
    }
    day.exercises.forEach((ex, e) => {
      if (ex.sets < 1 || ex.sets > 10)
        issues.push(`day ${d + 1} exercise ${e + 1}: ${ex.sets} sets`)
      if (ex.restSeconds < 0 || ex.restSeconds > 600) {
        issues.push(`day ${d + 1} exercise ${e + 1}: rest ${ex.restSeconds}s`)
      }
      if (!ex.name.trim()) issues.push(`day ${d + 1} exercise ${e + 1}: empty name`)
    })
  })
  return issues
}

/** Clamps and orders the body-fat range so it is always presentable. */
export function normalizeAnalysis(analysis: BodyAnalysis): BodyAnalysis {
  const clamp = (n: number) => Math.min(60, Math.max(3, Math.round(n)))
  const low = clamp(Math.min(analysis.bodyFatPercentLow, analysis.bodyFatPercentHigh))
  const high = clamp(Math.max(analysis.bodyFatPercentLow, analysis.bodyFatPercentHigh))
  return {
    ...analysis,
    bodyFatPercentLow: low,
    bodyFatPercentHigh: Math.max(high, low + 1),
    priorityAreas: analysis.priorityAreas.slice(0, 4),
  }
}
