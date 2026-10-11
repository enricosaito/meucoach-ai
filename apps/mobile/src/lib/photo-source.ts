import { ActionSheetIOS, Alert, Platform } from 'react-native'
import type { PhotoSource } from './body-photos'

/** Camera or library: an action sheet on iOS, an alert on Android, the file picker on web. */
export function choosePhotoSource(
  labels: { title: string; camera: string; library: string; cancel: string },
  onPick: (source: PhotoSource) => void,
) {
  if (Platform.OS === 'web') {
    onPick('library')
  } else if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: labels.title,
        options: [labels.camera, labels.library, labels.cancel],
        cancelButtonIndex: 2,
      },
      (index) => {
        if (index === 0) onPick('camera')
        if (index === 1) onPick('library')
      },
    )
  } else {
    Alert.alert(labels.title, undefined, [
      { text: labels.camera, onPress: () => onPick('camera') },
      { text: labels.library, onPress: () => onPick('library') },
      { text: labels.cancel, style: 'cancel' },
    ])
  }
}
