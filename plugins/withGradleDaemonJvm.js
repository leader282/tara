const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("expo/config-plugins");

// The Android prefab step fails under JDK 24+, so the Gradle daemon is pinned to JDK 17 regardless of JAVA_HOME.
module.exports = function withGradleDaemonJvm(config, { version = 17 } = {}) {
  return withDangerousMod(config, [
    "android",
    async (modConfig) => {
      const file = path.join(modConfig.modRequest.platformProjectRoot, "gradle", "gradle-daemon-jvm.properties");
      await fs.promises.mkdir(path.dirname(file), { recursive: true });
      await fs.promises.writeFile(file, `toolchainVersion=${version}\n`);
      return modConfig;
    },
  ]);
};
