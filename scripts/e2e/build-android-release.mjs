import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

// Builds a release APK for the E2E runners' `--build release` mode. The JS bundle is embedded,
// so there's no Metro or dev launcher, and the app runs at release speed. The build talks to
// local Supabase only: it refuses other hosts, allows the local stack's plain-HTTP traffic, and
// turns EAS Update off, since an over-the-air update would swap in the production bundle, which
// talks to hosted Supabase.

const repoRoot = path.resolve(new URL("../..", import.meta.url).pathname);
const androidDir = path.join(repoRoot, "android");
const overlayDir = path.join(androidDir, "app", "src", "release");
const overlayManifest = path.join(overlayDir, "AndroidManifest.xml");
const builtApk = path.join(androidDir, "app", "build", "outputs", "apk", "release", "app-release.apk");
const outputApk = path.join(repoRoot, ".maestro", ".e2e-data", "tara-e2e-release.apk");

const LOCAL_HOSTS = new Set(["10.0.2.2", "localhost", "127.0.0.1"]);

const manifestOverlay = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">
  <application android:usesCleartextTraffic="true" tools:replace="android:usesCleartextTraffic">
    <meta-data android:name="expo.modules.updates.ENABLED" android:value="false" tools:replace="android:value"/>
  </application>
</manifest>
`;

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with ${code}`));
    });
  });
}

async function main() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "http://10.0.2.2:54321";
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error(
      "Set EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the local stack's publishable key (`npx supabase status`)."
    );
  }
  if (!LOCAL_HOSTS.has(new URL(supabaseUrl).hostname)) {
    throw new Error(`E2E builds must point at local Supabase, not ${supabaseUrl}.`);
  }
  if (!existsSync(androidDir)) {
    throw new Error("No android/ project. Run `npx expo prebuild -p android` first.");
  }
  if (existsSync(overlayManifest)) {
    throw new Error(`${overlayManifest} already exists; this script only adds and removes its own.`);
  }

  const createdOverlayDir = !existsSync(overlayDir);
  mkdirSync(overlayDir, { recursive: true });
  writeFileSync(overlayManifest, manifestOverlay);
  try {
    const gradleArgs = [
      "assembleRelease",
      "-PreactNativeArchitectures=arm64-v8a",
      // Release lint and KSP share the build JVM; the project's 512 MB Metaspace runs out.
      "-Dorg.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=2g",
      "-x",
      "lintVitalRelease",
      "--no-daemon",
    ];
    await run("./gradlew", gradleArgs, {
      cwd: androidDir,
      env: {
        ...process.env,
        EXPO_NO_DOTENV: "1",
        EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
        EXPO_PUBLIC_APP_ENV: "e2e",
        EXPO_PUBLIC_SENTRY_DSN: "",
        SENTRY_DISABLE_AUTO_UPLOAD: "true",
        NODE_ENV: "production",
      },
    });
  } finally {
    rmSync(createdOverlayDir ? overlayDir : overlayManifest, { recursive: true });
  }

  mkdirSync(path.dirname(outputApk), { recursive: true });
  copyFileSync(builtApk, outputApk);
  console.log(`\nE2E release APK: ${path.relative(repoRoot, outputApk)}`);
  console.log("Install it with `adb -s <device> install -r <apk>`, then run the E2E scripts with --build release.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
