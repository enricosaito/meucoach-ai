# Mobile app permissions (for `apps/mobile`, Expo)

The web app already handles photo consent, private storage and deletion. When the Expo app is added,
it must request device permissions **only at the moment the user chooses to add a progress photo**,
never at launch, and the usage strings must match the Privacy Policy (section 9).

## Permissions

| Platform | Permission                                                                                         | Used for                                  |
| -------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| iOS      | `NSCameraUsageDescription`                                                                         | Taking progress photos                    |
| iOS      | `NSPhotoLibraryUsageDescription`                                                                   | Choosing progress photos from the library |
| Android  | `CAMERA`                                                                                           | Taking progress photos                    |
| Android  | Photo picker (no permission on Android 13+); `READ_MEDIA_IMAGES` only if the picker is unavailable | Choosing photos                           |
| Both     | Notifications (later)                                                                              | Reminders the user turns on               |

Use `expo-image-picker` and configure strings through its config plugin, localised:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "cameraPermission": "Usamos a câmera só quando você escolhe tirar fotos de progresso para analisar seu corpo e personalizar seu plano.",
          "photosPermission": "Usamos suas fotos só quando você escolhe uma foto de progresso para analisar seu corpo e personalizar seu plano."
        }
      ]
    ],
    "locales": { "pt": "./locales/pt.json", "en": "./locales/en.json" }
  }
}
```

`locales/en.json`:

```json
{
  "NSCameraUsageDescription": "We use the camera only when you choose to take progress photos to analyse your body and personalise your plan.",
  "NSPhotoLibraryUsageDescription": "We use your photos only when you choose a progress photo to analyse your body and personalise your plan."
}
```

## Same rules as the web app

- Show the in-app consent screen (`consent.*` translations, `PUT /api/v1/me/consents/body_photos`)
  before the OS permission prompt.
- Resize to ≤ 1600 px and re-encode as JPEG before upload (e.g. `expo-image-manipulator`); this
  strips EXIF/GPS metadata.
- Upload with the signed URLs from `POST /api/v1/training/photos/upload-urls`, then call
  `POST /api/v1/training/plans`. Never upload with a service key.
- App Store "App Privacy" / Play "Data safety": declare health & fitness data and photos, linked to
  the user, not used for tracking, deletable in-app.
