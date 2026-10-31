# BENAOUDA TV Android TV

This folder contains a native Android TV wrapper around the BENAOUDA TV dashboard. Its Jellyfin page connects to a Jellyfin server using the public Jellyfin HTTP API, displays the signed-in user's movies and series, and requests a playback stream from that server. No Jellyfin client source is bundled into this project.

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
The Gradle build copies the web app's current `index.html`, `script.js`, and `styles.css` into the Android assets before packaging.

## Connect to Jellyfin

Open the **Jellyfin** tab and enter the server URL, username, and password. The URL can include a reverse-proxy path, for example `https://media.example.com/jellyfin`. The app stores the server address and Jellyfin access token on the device so it can reconnect; it does not save the password. Disconnect from the Jellyfin page to clear the saved token.

The Android app sends Jellyfin API requests through a WebView message bridge restricted to the app's local asset origin. The browser preview uses `fetch`; Jellyfin must allow the preview page's origin in its CORS settings. For video playback, the server must provide a stream compatible with the device's WebView, or a supported MP4 transcode profile.

This remains a client wrapper, not an IPTV backend or media server. Install it only on Android TV or Fire OS devices that support APK sideloading; Vega OS does not support this installation path.
