# BENAOUDA TV Android TV

This folder contains a native Android TV wrapper around the BENAOUDA TV streaming dashboard. The app loads the existing web UI from local app assets so the branding and streaming layout stay consistent on Fire TV / Android TV devices.

## Requirements

- Android Studio
- Android SDK with API 34
- JDK 17+

## Build

1. Open this folder in Android Studio or run Gradle from the terminal.
2. Accept the Android SDK licenses on the machine running the build.
3. Run:

```bash
./gradlew assembleDebug
```

The generated APK will be in `app/build/outputs/apk/debug/`.

## Notes

This is a native TV wrapper, not a backend IPTV service. For real Fire TV use, target a device still running Fire OS and keep the app's runtime restricted to supported sideloading workflows.
