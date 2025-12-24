/**
 * Expo App Configuration
 *
 * STABLE DEV CLIENT CONFIG
 * - New Architecture: DISABLED
 * - Compatible with Expo Dev Client + Agora
 * - Single source of truth (replaces app.json)
 */

module.exports = ({ config }) => {
  return {
    ...config,

    // ─────────────────────────────────────────────────────────────
    // ❌ DISABLE NEW ARCHITECTURE (CRITICAL)
    // ─────────────────────────────────────────────────────────────
    newArchEnabled: false,

    name: "Roast Live",
    slug: "roast-live-app-fauwkm",
    owner: "hasselite",
    scheme: "roastlive",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",

    icon: "./assets/images/4c2b1c5e-b641-4b69-8db4-72171c03e08f.png",

    splash: {
      image: "./assets/images/4c2b1c5e-b641-4b69-8db4-72171c03e08f.png",
      resizeMode: "contain",
      backgroundColor: "#000000",
    },

    assetBundlePatterns: ["**/*"],

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.hasselite.roastlive",
      googleServicesFile: "./google-services.json",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription:
          "Roast Live needs access to your camera to let you stream and use AR filters.",
        NSMicrophoneUsageDescription:
          "Roast Live needs access to your microphone so others can hear you during the roast.",
        NSPhotoLibraryUsageDescription:
          "Roast Live needs access to your photo library to share images.",
      },
    },

    android: {
      package: "com.hasselite.roastlive",
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        foregroundImage:
          "./assets/images/4c2b1c5e-b641-4b69-8db4-72171c03e08f.png",
        backgroundColor: "#000000",
      },
      permissions: [
        "CAMERA",
        "RECORD_AUDIO",
        "INTERNET",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE",
      ],
    },

    web: {
      bundler: "metro",
      favicon:
        "./assets/images/f66cb126-9803-450a-8302-15c0e53a3af9.png",
    },

    plugins: [
      "expo-router",

      [
        "expo-camera",
        {
          cameraPermission:
            "Roast Live needs access to your camera to let you stream and use AR filters.",
          microphonePermission:
            "Roast Live needs access to your microphone so others can hear you during the roast.",
          recordAudioAndroid: true,
        },
      ],

      [
        "expo-notifications",
        {
          sounds: ["./assets/sounds/notification.wav"],
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "fb484f3b-ad66-438e-b8a8-0620a968d51b",
      },
    },
  };
};
