import { Salad } from 'lucide-react-native'
import { ComingSoon } from '../../components/coming-soon'
import { MacroTiles } from '../../components/home/macro-tiles'
import { useI18n } from '../../lib/i18n'
import { useMe } from '../../lib/me'

/** Daily macro targets now; the diet plan and questionnaire are still being ported. */
export default function DietScreen() {
  const { t } = useI18n()
  const { me } = useMe()
  return (
    <ComingSoon title={t('diet.title')} icon={Salad}>
      {me?.targets && <MacroTiles targets={me.targets} />}
    </ComingSoon>
  )
}
