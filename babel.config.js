module.exports = function (api) {
  api.cache(true);

  const EDITABLE_COMPONENTS =
    process.env.EXPO_PUBLIC_ENABLE_EDIT_MODE === "TRUE" &&
    process.env.NODE_ENV === "development"
      ? [
          ["./babel-plugins/editable-elements.js", {}],
          ["./babel-plugins/inject-source-location.js", {}],
        ]
      : [];

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          extensions: [
            ".native.tsx",
            ".native.ts",
            ".web.tsx",
            ".web.ts",
            ".ios.tsx",
            ".ios.ts",
            ".android.tsx",
            ".android.ts",
            ".tsx",
            ".ts",
            ".jsx",
            ".js",
            ".json",
          ],
          alias: {
            "@": "./",
            "@components": "./components",
            "@style": "./style",
            "@hooks": "./hooks",
            "@types": "./types",
            "@contexts": "./contexts",
          },
        },
      ],

      ...EDITABLE_COMPONENTS,

      "@babel/plugin-proposal-export-namespace-from",

      // ✅ REQUIRED FOR react-native-reanimated v2 (MUST BE LAST)
      "react-native-reanimated/plugin",
    ],
  };
};
