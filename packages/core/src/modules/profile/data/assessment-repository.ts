import { dbError, type AdminClient } from '../../../shared'
import type { Tables, TablesInsert } from '@mycoach/db'

export type AssessmentRow = Tables<'metabolic_assessments'>

export async function insertAssessment(
  db: AdminClient,
  row: TablesInsert<'metabolic_assessments'> & { user_id: string },
): Promise<AssessmentRow> {
  const { data, error } = await db.from('metabolic_assessments').insert(row).select('*').single()
  if (error) throw dbError('insertAssessment', error)
  return data
}

export async function findLatestAssessment(
  db: AdminClient,
  userId: string,
): Promise<AssessmentRow | null> {
  const { data, error } = await db
    .from('metabolic_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw dbError('findLatestAssessment', error)
  return data
}
