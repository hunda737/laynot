const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// withShortCmakePaths: keep native object paths under the Windows limit';

/**
 * Windows refuses file paths over 260 characters, and the build tool that ships with the
 * Android SDK (Ninja 1.10) cannot go past that even with Windows long paths switched on.
 * The Android Gradle Plugin tells CMake it may use object paths up to 1024 characters, so the
 * native code for react-native-screens, safe-area-context and friends lands on paths of 290 to
 * 340 characters and the build stops with "Filename longer than 260 characters".
 *
 * This puts CMake's own Windows default (250) back, after the plugin's value. CMake then
 * shortens the directory part of any longer object path by hashing it, so every path fits.
 * Lower values do not help: below about 240 CMake decides the paths cannot be shortened enough
 * and leaves them long. Only Windows machines need this, so builds on other systems
 * (including EAS cloud builds) are left alone.
 */
module.exports = function withShortCmakePaths(config, { limit = 250 } = {}) {
  if (process.platform !== 'win32') return config;

  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('withShortCmakePaths: android/app/build.gradle is not Groovy, so it was not changed.');
    }
    const source = cfg.modResults.contents;
    if (source.includes(MARKER)) return cfg;

    const patched = source.replace(
      /(\n[ \t]*defaultConfig[ \t]*\{)/,
      `$1\n        ${MARKER}\n        externalNativeBuild { cmake { arguments "-DCMAKE_OBJECT_PATH_MAX=${limit}" } }`,
    );
    if (patched === source) {
      throw new Error('withShortCmakePaths: could not find defaultConfig in android/app/build.gradle.');
    }
    cfg.modResults.contents = patched;
    return cfg;
  });
};
