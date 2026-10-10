import { ScrollView, StyleSheet } from 'react-native'
import { PlanWizard } from '../components/training/plan-wizard'
import { space, useColors } from '../theme'

/** The plan questionnaire, pushed from the Training tab (native back returns there). */
export default function NewPlanScreen() {
  const colors = useColors()
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
    >
      <PlanWizard />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl * 2 },
})
