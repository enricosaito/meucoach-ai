import { Salad } from 'lucide-react-native'
import { ComingSoon } from '../../components/coming-soon'
import { useI18n } from '../../lib/i18n'

export default function DietScreen() {
  const { t } = useI18n()
  return <ComingSoon title={t('diet.title')} icon={Salad} />
}
