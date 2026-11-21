import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { waitForDeviceToSettle } from "./android-device.mjs";
import { installMaestroDriver, REUSE_DRIVER_ARG, stopMaestroDriverSession } from "./maestro-driver.mjs";

const repoRoot = path.resolve(new URL("../..", import.meta.url).pathname);
const dataDir = path.join(repoRoot, ".maestro", ".e2e-data");

function getArg(name) {
  const prefix = `${name}=`;
  const inlineArg = process.argv.find((arg) => arg.startsWith(prefix));
  if (inlineArg) {
    return inlineArg.slice(prefix.length);
  }

  const index = process.argv.indexOf(name);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function sanitizeRunId(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
}

function getRunId() {
  const requested = getArg("--run-id") ?? process.env.E2E_RUN_ID;
  return sanitizeRunId(requested ?? new Date().toISOString());
}

const OUTPUT_TAIL_CHARS = 20_000;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: {
        ...process.env,
        MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED: "true",
        MAESTRO_CLI_NO_ANALYTICS: "1",
        MAESTRO_DRIVER_STARTUP_TIMEOUT: "120000",
        ...(options.env ?? {}),
      },
      stdio: ["inherit", "pipe", "pipe"],
    });

    let outputTail = "";
    const keepTail = (stream, target) => {
      stream.on("data", (chunk) => {
        target.write(chunk);
        outputTail = (outputTail + chunk.toString()).slice(-OUTPUT_TAIL_CHARS);
      });
    };
    keepTail(child.stdout, process.stdout);
    keepTail(child.stderr, process.stderr);

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const error = new Error(`${command} ${args.join(" ")} failed with ${signal ?? code}`);
      error.outputTail = outputTail;
      reject(error);
    });
  });
}

const devicesWithDriver = new Set();

async function runMaestro(flowPath, { device, env = {} } = {}) {
  try {
    await runMaestroOnce(flowPath, { device, env });
  } catch (error) {
    // No flow step ran if Maestro's on-device driver never came up, so reset it and retry once.
    if (!device?.startsWith("emulator-") || !/did not start up in time/.test(error.outputTail ?? "")) {
      throw error;
    }
    await stopMaestroDriverSession(device);
    await installMaestroDriver(device);
    await delay(5_000);
    await runMaestroOnce(flowPath, { device, env });
  }
}

function runMaestroOnce(flowPath, { device, env = {} } = {}) {
  const args = [];
  if (device) {
    args.push("--device", device);
  }

  args.push("test");
  if (devicesWithDriver.has(device)) {
    args.push(REUSE_DRIVER_ARG);
  }
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined || value === null) {
      continue;
    }

    args.push("-e", `${key}=${value}`);
  }
  args.push(flowPath);

  return run("maestro", args);
}

// Password-manager save prompts cover the app. Maestro's hideKeyboard is a bare Back press,
// so the full soft keyboard must open: not suppressed by a hardware keyboard, and not
// replaced by Gboard's stylus toolbar, which treats injected touches as a stylus.
async function prepareAndroidDevice(device) {
  const settings = [
    ["autofill_service", "null"],
    ["show_ime_with_hard_keyboard", "1"],
    ["stylus_handwriting_enabled", "0"],
  ];
  for (const [key, value] of settings) {
    await run("adb", ["-s", device, "shell", "settings", "put", "secure", key, value]);
  }
  // Instant system transitions (screens, keyboard, dialogs) cut Maestro's settle waits. The
  // app's own animations use React Native's Animated, which these scales don't affect.
  for (const scale of ["window_animation_scale", "transition_animation_scale", "animator_duration_scale"]) {
    await run("adb", ["-s", device, "shell", "settings", "put", "global", scale, "0"]);
  }
  await installMaestroDriver(device);
  devicesWithDriver.add(device);
  await waitForDeviceToSettle(device);
}

function loadRunData(runId) {
  const dataPath = path.join(dataDir, `${runId}.json`);
  if (!existsSync(dataPath)) {
    throw new Error(`Missing ${dataPath}. Run setup before --skip-setup.`);
  }

  return JSON.parse(readFileSync(dataPath, "utf8"));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Launch flows concurrently, but stagger each start by `staggerMs`. Two Expo
// dev clients cold-loading a bundle at the same instant saturate the host (CPU,
// IO, Metro) and the slower device's app gets ANR-killed back to the home screen.
// The stagger must exceed a single device's full cold launch + sign-in + navigate
// time so the receiver is already idle-watching before the sender starts its
// heavy launch — only then is there no overlapping bundle load to crash the sender.
async function runConcurrent(flows, { staggerMs = 110000 } = {}) {
  const results = await Promise.allSettled(
    flows.map(async (flow, index) => {
      if (index > 0 && staggerMs > 0) {
        await delay(index * staggerMs);
      }
      return runMaestro(flow.path, flow);
    })
  );
  const failed = results.find((result) => result.status === "rejected");
  if (failed?.status === "rejected") {
    throw failed.reason;
  }
}

async function runStep(label, action, results) {
  console.log(`\n=== STEP: ${label} ===`);
  try {
    await action();
    results.push({ label, status: "passed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`STEP FAILED: ${label} -> ${message}`);
    results.push({ label, status: "failed", error: message });
  }
}

function printSummary(results) {
  console.log("\n==== E2E SUITE SUMMARY ====");
  for (const result of results) {
    const marker = result.status === "passed" ? "PASS" : "FAIL";
    console.log(`${marker}  ${result.label}`);
  }

  const failed = results.filter((result) => result.status === "failed");
  console.log(`\n${results.length - failed.length}/${results.length} steps passed.`);
  return failed;
}

async function main() {
  const runId = getRunId();
  const androidDevice = getArg("--android-device") ?? process.env.E2E_ANDROID_DEVICE;
  const iosDevice = getArg("--ios-device") ?? process.env.E2E_IOS_DEVICE;
  const keepData = hasFlag("--keep-data") || process.env.E2E_KEEP_DATA === "1";
  const skipSetup = hasFlag("--skip-setup");
  // --realtime-only runs just the concurrent cross-device pulse step against the
  // seeded (already-paired) owner+partner couple. Useful for fast iteration on the
  // realtime launch-timing race without re-running the full ~30 min suite.
  const realtimeOnly = hasFlag("--realtime-only");
  // Which build is installed on the devices: the dev client on Metro, or a release build.
  const build = getArg("--build") ?? process.env.E2E_BUILD ?? "dev";

  if (!androidDevice && !iosDevice) {
    throw new Error(
      "Set E2E_ANDROID_DEVICE and/or E2E_IOS_DEVICE. Use `maestro list-devices` to find ids."
    );
  }
  if (build !== "dev" && build !== "release") {
    throw new Error(`--build must be "dev" or "release", not "${build}".`);
  }

  const results = [];

  try {
    for (const device of [androidDevice, iosDevice]) {
      if (device?.startsWith("emulator-")) {
        await prepareAndroidDevice(device);
      }
    }

    if (!skipSetup) {
      await run("node", ["scripts/e2e/supabase-e2e-data.mjs", "setup", "--run-id", runId]);
    }

    const data = loadRunData(runId);
    const commonEnv = {
      E2E_BUILD: build,
      E2E_PASSWORD: data.password,
      E2E_RUN_ID: data.runId,
      E2E_INVITE_CODE: data.invite.code,
      E2E_INVALID_INVITE_CODE: data.invite.invalidCode,
      E2E_READY_CAPSULE_TITLE: data.seededCapsules.readyCapsuleTitle,
      E2E_LOCKED_CAPSULE_TITLE: data.seededCapsules.lockedCapsuleTitle,
      E2E_SMOKE_EMAIL: data.smokeEmail,
    };

    if (androidDevice && !realtimeOnly) {
      await runStep(
        "android: smoke onboarding + create couple",
        () =>
          runMaestro(".maestro/smoke/onboarding-create-couple.yaml", {
            device: androidDevice,
            env: commonEnv,
          }),
        results
      );
      await runStep(
        "android: paired core (owner)",
        () =>
          runMaestro(".maestro/e2e/paired-core.yaml", {
            device: androidDevice,
            env: {
              ...commonEnv,
              E2E_EMAIL: data.users.owner.email,
              E2E_PARTNER_NAME: data.users.partner.displayName,
            },
          }),
        results
      );
    }

    const inviteDevice = iosDevice ?? androidDevice;
    if (inviteDevice && !realtimeOnly) {
      await runStep(
        `${iosDevice ? "partner phone" : "android"}: invite acceptance`,
        () =>
          runMaestro(".maestro/e2e/invite-acceptance.yaml", {
            device: inviteDevice,
            env: {
              ...commonEnv,
              E2E_EMAIL: data.users.invitee.email,
            },
          }),
        results
      );
    }

    if (iosDevice && !realtimeOnly) {
      await runStep(
        "partner phone: paired core (partner)",
        () =>
          runMaestro(".maestro/e2e/paired-core.yaml", {
            device: iosDevice,
            env: {
              ...commonEnv,
              E2E_EMAIL: data.users.partner.email,
              E2E_PARTNER_NAME: data.users.owner.displayName,
            },
          }),
        results
      );
    }

    if (androidDevice && iosDevice) {
      await runStep(
        "cross-device: realtime presence pulse (owner phone receives partner phone)",
        () =>
          runConcurrent([
            {
              path: ".maestro/realtime/android-wait-for-pulse.yaml",
              device: androidDevice,
              env: {
                ...commonEnv,
                E2E_EMAIL: data.users.owner.email,
                E2E_PARTNER_NAME: data.users.partner.displayName,
                E2E_PULSE_NOTE: `E2E pulse ${data.runId}`,
              },
            },
            {
              path: ".maestro/realtime/ios-send-pulse.yaml",
              device: iosDevice,
              env: {
                ...commonEnv,
                E2E_EMAIL: data.users.partner.email,
                E2E_PARTNER_NAME: data.users.owner.displayName,
                E2E_PULSE_NOTE: `E2E pulse ${data.runId}`,
              },
            },
          ]),
        results
      );
    }

    // Run the destructive account-safety flow last: requesting account deletion
    // archives the active couple, so it must not run before flows that need the
    // seeded couple to stay paired.
    if (androidDevice && !realtimeOnly) {
      await runStep(
        "android: account safety (export, deletion, archive)",
        () =>
          runMaestro(".maestro/e2e/account-safety.yaml", {
            device: androidDevice,
            env: {
              ...commonEnv,
              E2E_EMAIL: data.users.safetyOwner.email,
            },
          }),
        results
      );
    }
  } finally {
    if (keepData) {
      console.log(`\nKeeping E2E data for run ${runId}`);
    } else {
      await run("node", ["scripts/e2e/supabase-e2e-data.mjs", "cleanup", "--run-id", runId]);
    }
  }

  const failed = printSummary(results);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
