const { withAndroidManifest, withMainApplication, withDangerousMod, withStringsXml, withAppBuildGradle, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withDoomscrolling = (config) => {
  // 1. Update AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

    // Add Accessibility Service
    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const serviceName = 'com.shaz.arete.DoomscrollingAccessibilityService';
    const existingService = mainApplication.service.find(
      (s) => s.$['android:name'] === serviceName || s.$['android:name'] === '.DoomscrollingAccessibilityService'
    );

    if (!existingService) {
      mainApplication.service.push({
        $: {
          'android:name': '.DoomscrollingAccessibilityService',
          'android:exported': 'true',
          'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.accessibilityservice',
              'android:resource': '@xml/doomscrolling_service',
            },
          },
        ],
      });
    }

    // Add necessary permissions if not present
    const permissions = [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
      'android.permission.PACKAGE_USAGE_STATS',
    ];

    permissions.forEach(perm => {
      if (!config.modResults.manifest['uses-permission']) {
        config.modResults.manifest['uses-permission'] = [];
      }
      if (!config.modResults.manifest['uses-permission'].find(p => p.$['android:name'] === perm)) {
        config.modResults.manifest['uses-permission'].push({ $: { 'android:name': perm } });
      }
    });

    return config;
  });

  // 2. Add Package to MainApplication.kt
  config = withMainApplication(config, (config) => {
    if (config.modResults.language === 'kt') {
      let content = config.modResults.contents;

      // Add import if missing
      if (!content.includes('import com.shaz.arete.DoomscrollingPackage')) {
        const packageMatch = content.match(/package .*/);
        if (packageMatch) {
          content = content.replace(
            packageMatch[0],
            `${packageMatch[0]}\n\nimport com.shaz.arete.DoomscrollingPackage`
          );
        }
      }

      // Add to packageList in ExpoReactHostFactory
      if (content.includes('packageList =') && !content.includes('add(DoomscrollingPackage())')) {
        content = content.replace(
          /packageList =([\s\S]*?)\.packages\.apply \{([\s\S]*?)\}/,
          (match, p1, p2) => {
             return `packageList =${p1}.packages.apply {${p2}          add(DoomscrollingPackage())\n        }`;
          }
        );
      }

      config.modResults.contents = content;
    }
    return config;
  });

  // 3. Add Strings
  config = withStringsXml(config, (config) => {
    const stringName = 'doomscrolling_service_description';
    const stringValue = 'Arete uses this service to detect when you open apps with short-form video feeds (Reels, Shorts, TikToks) and helps you block them. No personal data is read or transmitted.';

    if (!config.modResults.resources.string) {
      config.modResults.resources.string = [];
    }

    const existing = config.modResults.resources.string.find(s => s.$.name === stringName);
    if (!existing) {
      config.modResults.resources.string.push({
        $: { name: stringName },
        _: stringValue,
      });
    }
    return config;
  });

  // 4. Inject Signing Config into build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let content = config.modResults.contents;

      // Add signingConfigs release block if it doesn't exist
      if (!content.includes("storeFile file('release.keystore')")) {
        content = content.replace(
          /signingConfigs \{/,
          `signingConfigs {\n        release {\n            storeFile file('release.keystore')\n            storePassword 'arete123'\n            keyAlias 'arete'\n            keyPassword 'arete123'\n        }`
        );
      }

      // Update release buildType to use release signingConfig
      // 1. Restore debug signingConfig for debug buildType (in case it was mistakenly changed)
      content = content.replace(
          /debug \{([\s\S]*?)signingConfig signingConfigs\.release/,
          'debug {$1signingConfig signingConfigs.debug'
      );

      // 2. Update release buildType to use release signingConfig
      const buildTypesStart = content.indexOf('buildTypes {');
      if (buildTypesStart !== -1) {
          const contentAfterBuildTypes = content.substring(buildTypesStart);
          const releaseIndex = contentAfterBuildTypes.indexOf('release {');
          if (releaseIndex !== -1) {
              const contentAfterRelease = contentAfterBuildTypes.substring(releaseIndex);
              const updatedContentAfterRelease = contentAfterRelease.replace(
                  'signingConfig signingConfigs.debug',
                  'signingConfig signingConfigs.release'
              );
              content = content.substring(0, buildTypesStart + releaseIndex) + updatedContentAfterRelease;
          }
      }

      config.modResults.contents = content;
    }
    return config;
  });

  // 5. Copy native files & keystore (Dangerous Mod)
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const srcDir = path.join(projectRoot, 'src/native-modules/android');
      const destDir = path.join(projectRoot, 'android/app/src/main/java/com/shaz/arete');
      const resXmlDir = path.join(projectRoot, 'android/app/src/main/res/xml');
      const appDir = path.join(projectRoot, 'android/app');

      // Create directories if they don't exist
      fs.mkdirSync(destDir, { recursive: true });
      fs.mkdirSync(resXmlDir, { recursive: true });

      // Copy Kotlin files
      const kotlinFiles = [
        'DoomscrollingAccessibilityService.kt',
        'DoomscrollingModule.kt',
        'DoomscrollingPackage.kt',
      ];

      kotlinFiles.forEach((file) => {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);
        if (fs.existsSync(srcFile)) {
          fs.copyFileSync(srcFile, destFile);
        }
      });

      // Copy XML resource
      const xmlFile = 'doomscrolling_service.xml';
      const srcXml = path.join(srcDir, 'res/xml', xmlFile);
      const destXml = path.join(resXmlDir, xmlFile);
      if (fs.existsSync(srcXml)) {
        fs.copyFileSync(srcXml, destXml);
      }

      // Copy Keystore
      const keystoreFile = 'release.keystore';
      const srcKeystore = path.join(srcDir, keystoreFile);
      const destKeystore = path.join(appDir, keystoreFile);
      if (fs.existsSync(srcKeystore)) {
        fs.copyFileSync(srcKeystore, destKeystore);
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withDoomscrolling;
