import { Dumbbell } from 'lucide-react-native'
import { ComingSoon } from '../../components/coming-soon'
import { useI18n } from '../../lib/i18n'

export default function TrainingScreen() {
  const { t } = useI18n()
  return <ComingSoon title={t('training.title')} icon={Dumbbell} />
}
