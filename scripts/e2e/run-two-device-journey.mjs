import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { waitForDeviceToSettle } from "./android-device.mjs";
import { installMaestroDriver, REUSE_DRIVER_ARG, stopMaestroDriverSession } from "./maestro-driver.mjs";

// Two-device journey: both partners start from a fresh sign-up on separate devices and
// exercise every feature against each other. Steps run in order because each one
// continues from the app state the previous step left behind.

const repoRoot = path.resolve(new URL("../..", import.meta.url).pathname);
const outputDir = path.join(repoRoot, ".maestro", ".e2e-data");
const journeyDir = ".maestro/journey";
const photoFixture = path.join(repoRoot, ".maestro", "fixtures", "tara-e2e-photo.jpg");
const password = "TaraE2E!123";

function getArg(name) {
  const prefix = `${name}=`;
  const inlineArg = process.argv.find((arg) => arg.startsWith(prefix));
  if (inlineArg) {
    return inlineArg.slice(prefix.length);
  }

  const index = process.argv.indexOf(name);
  return index === -1 ? null : (process.argv[index + 1] ?? null);
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function sanitizeRunId(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Point it at the Supabase project the app under test uses.`);
  }
  return value;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const activeChildren = new Set();

const OUTPUT_TAIL_CHARS = 20_000;

function run(command, args, { quiet = false, onOutput } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      // Own process group, so stopping a Maestro run also stops the JVM it launches.
      detached: true,
      env: {
        ...process.env,
        MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED: "true",
        MAESTRO_CLI_NO_ANALYTICS: "1",
        MAESTRO_DRIVER_STARTUP_TIMEOUT: "120000",
      },
      stdio: quiet ? "ignore" : ["ignore", "pipe", "pipe"],
    });
    activeChildren.add(child);

    let outputTail = "";
    const keepTail = (stream, target) => {
      stream?.on("data", (chunk) => {
        target.write(chunk);
        outputTail = (outputTail + chunk.toString()).slice(-OUTPUT_TAIL_CHARS);
        onOutput?.(outputTail);
      });
    };
    keepTail(child.stdout, process.stdout);
    keepTail(child.stderr, process.stderr);

    child.on("error", (error) => {
      activeChildren.delete(child);
      reject(error);
    });
    child.on("exit", (code, signal) => {
      activeChildren.delete(child);
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

function stopActiveChildren() {
  for (const child of activeChildren) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      // Already gone.
    }
  }
}

process.on("SIGINT", () => {
  stopActiveChildren();
  process.exit(130);
});

// Watcher flows label the step after which they're in place "Ready to watch ...".
const READY_TO_WATCH = /Ready to watch[^\n]*COMPLETED/;

// One phone watches while the other acts. The actor starts once the watcher reports it's in
// place, so the change has to arrive live and the two Maestro drivers never start together
// (that can time them out). If either side fails, the other is stopped so it can't keep
// holding its device into the next step.
async function watchWhileActing(watch, act, maxHeadStartMs = 90_000) {
  let cancelled = false;
  let markReady = () => {};
  const ready = new Promise((resolve) => {
    markReady = resolve;
  });
  const headStartOver = new Promise((resolve) => setTimeout(resolve, maxHeadStartMs).unref());
  const watching = watch(markReady);
  const watcherSettled = watching.then(
    () => {},
    () => {
      cancelled = true;
    }
  );
  const acting = Promise.race([ready, headStartOver, watcherSettled]).then(() =>
    cancelled ? undefined : act()
  );
  try {
    await Promise.all([watching, acting]);
  } catch (error) {
    cancelled = true;
    stopActiveChildren();
    await Promise.allSettled([watching, acting]);
    throw error;
  }
}

async function stopStrayMaestro(devices) {
  for (const device of devices) {
    await run("pkill", ["-f", `maestro.cli.AppKt --device ${device} `], { quiet: true }).catch(() => {});
    await stopMaestroDriverSession(device);
  }
}

async function runMaestro(device, flow, env, { onReady } = {}) {
  const args = ["--device", device, "test", REUSE_DRIVER_ARG];
  for (const [key, value] of Object.entries(env)) {
    args.push("-e", `${key}=${value}`);
  }
  args.push(path.join(journeyDir, flow));
  const onOutput = onReady
    ? (output) => {
        if (READY_TO_WATCH.test(output)) {
          onReady();
        }
      }
    : undefined;

  const startedAt = Date.now();
  try {
    await run("maestro", args, { onOutput });
  } catch (error) {
    // Failing within seconds (adb briefly dropping the device) or before Maestro's on-device
    // driver came up means no flow step ran, so it's safe to reset the driver and retry once.
    const neverStarted =
      Date.now() - startedAt < 20_000 || /did not start up in time/.test(error.outputTail ?? "");
    if (!neverStarted) {
      throw error;
    }
    await stopMaestroDriverSession(device);
    await installMaestroDriver(device);
    await delay(5_000);
    await run("maestro", args, { onOutput });
  }
}

async function prepareDevice(device) {
  // Password-manager save prompts cover the app. Maestro's hideKeyboard is a bare Back press,
  // so the full soft keyboard must open: not suppressed by a hardware keyboard, and not
  // replaced by Gboard's stylus toolbar, which treats injected touches as a stylus.
  await run("adb", ["-s", device, "shell", "settings", "put", "secure", "autofill_service", "null"]);
  await run("adb", ["-s", device, "shell", "settings", "put", "secure", "show_ime_with_hard_keyboard", "1"]);
  await run("adb", ["-s", device, "shell", "settings", "put", "secure", "stylus_handwriting_enabled", "0"]);
  // Instant system transitions (screens, keyboard, dialogs) cut Maestro's settle waits. The
  // app's own animations use React Native's Animated, which these scales don't affect.
  for (const scale of ["window_animation_scale", "transition_animation_scale", "animator_duration_scale"]) {
    await run("adb", ["-s", device, "shell", "settings", "put", "global", scale, "0"]);
  }
  await run("adb", ["-s", device, "push", photoFixture, "/sdcard/Pictures/tara-e2e-photo.jpg"], {
    quiet: true,
  });
  await run(
    "adb",
    [
      "-s",
      device,
      "shell",
      "content",
      "call",
      "--uri",
      "content://media/external/file",
      "--method",
      "scan_file",
      "--arg",
      "/sdcard/Pictures/tara-e2e-photo.jpg",
    ],
    { quiet: true }
  ).catch(() =>
    run(
      "adb",
      [
        "-s",
        device,
        "shell",
        "am",
        "broadcast",
        "-a",
        "android.intent.action.MEDIA_SCANNER_SCAN_FILE",
        "-d",
        "file:///sdcard/Pictures/tara-e2e-photo.jpg",
      ],
      { quiet: true }
    )
  );
  await installMaestroDriver(device);
  await waitForDeviceToSettle(device);
}

function createAdminClient() {
  return createClient(requireEnv("E2E_SUPABASE_URL"), requireEnv("E2E_SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function findUserId(admin, email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      throw new Error(`List auth users: ${error.message}`);
    }

    const user = data.users.find((candidate) => candidate.email === email);
    if (user) {
      return user.id;
    }

    if (data.users.length < 1000) {
      throw new Error(`No auth user for ${email}`);
    }
  }
}

async function getActiveInviteCode(admin, email) {
  const userId = await findUserId(admin, email);
  const { data: memberships, error: membershipError } = await admin
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", userId)
    .eq("status", "active");
  if (membershipError) {
    throw new Error(`Load memberships: ${membershipError.message}`);
  }

  const coupleIds = memberships.map((membership) => membership.couple_id);
  const { data: invites, error: inviteError } = await admin
    .from("couple_invites")
    .select("invite_code")
    .in("couple_id", coupleIds)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);
  if (inviteError) {
    throw new Error(`Load invite: ${inviteError.message}`);
  }
  if (!invites?.[0]) {
    throw new Error(`No active invite for ${email}`);
  }

  return invites[0].invite_code;
}

// Capsules can only be created with a future unlock time, so the journey moves the
// unlock time into the past to stand in for the wait.
async function unlockCapsule(admin, title) {
  const { data, error } = await admin
    .from("memory_capsules")
    .update({ unlock_at: new Date(Date.now() - 60_000).toISOString() })
    .eq("title", title)
    .select("id");
  if (error) {
    throw new Error(`Unlock capsule "${title}": ${error.message}`);
  }
  if (!data?.length) {
    throw new Error(`Capsule "${title}" not found`);
  }
}

async function main() {
  const runId = sanitizeRunId(getArg("--run-id") ?? process.env.E2E_RUN_ID ?? new Date().toISOString());
  const deviceA = getArg("--device-a") ?? process.env.E2E_DEVICE_A;
  const deviceB = getArg("--device-b") ?? process.env.E2E_DEVICE_B;
  const keepData = hasFlag("--keep-data") || process.env.E2E_KEEP_DATA === "1";
  const fromStep = Number(getArg("--from-step") ?? "1");
  // Which build is installed on the devices: the dev client on Metro, or a release build.
  const build = getArg("--build") ?? process.env.E2E_BUILD ?? "dev";
  if (!deviceA || !deviceB) {
    throw new Error("Pass --device-a and --device-b (see `adb devices`).");
  }
  if (build !== "dev" && build !== "release") {
    throw new Error(`--build must be "dev" or "release", not "${build}".`);
  }

  const admin = createAdminClient();
  const a = {
    device: deviceA,
    email: `tara.e2e.${runId}.journey-a@example.com`,
    name: "Asha E2E",
    newName: "Asha Rao E2E",
  };
  const b = {
    device: deviceB,
    email: `tara.e2e.${runId}.journey-b@example.com`,
    name: "Ravi E2E",
  };
  const shared = { J_PASSWORD: password, J_RUN_ID: runId, E2E_BUILD: build };
  const capsuleTitle = `Journey capsule ${runId}`;
  const capsuleNote = `A note for future us ${runId}`;
  const photoCapsuleTitle = `Photo capsule ${runId}`;
  const state = {};

  const steps = [
    {
      label: "A signs up and onboards with every optional choice",
      critical: true,
      run: () =>
        runMaestro(a.device, "01-signup-onboarding.yaml", {
          ...shared,
          J_EMAIL: a.email,
          J_NAME: a.name,
          J_TIMEZONE: "Asia/Kolkata",
          J_CUSTOM: "1",
          J_CITY: "Mumbai",
          J_COUNTRY: "India",
        }),
    },
    {
      label: "B signs up from another time zone with default choices",
      critical: true,
      run: () =>
        runMaestro(b.device, "01-signup-onboarding.yaml", {
          ...shared,
          J_EMAIL: b.email,
          J_NAME: b.name,
          J_TIMEZONE: "Europe/London",
          J_CUSTOM: "0",
          J_CITY: "",
          J_COUNTRY: "",
        }),
    },
    {
      label: "A creates the couple space and shares the invite",
      critical: true,
      run: () => runMaestro(a.device, "02-create-couple.yaml", { ...shared, J_WITH_ANNIVERSARY: "1" }),
    },
    {
      label: "B rejects a bad code, then joins with A's code",
      critical: true,
      run: async () => {
        state.inviteCode = await getActiveInviteCode(admin, a.email);
        await runMaestro(b.device, "03-join-couple.yaml", {
          ...shared,
          J_INVITE_CODE: state.inviteCode,
          J_INVITE_LINK: `tara://${state.inviteCode}`,
          J_PARTNER_NAME: a.name,
        });
      },
    },
    {
      label: "A's waiting screen unlocks on its own once B joins",
      run: () => runMaestro(a.device, "04-waiting-unlocks.yaml", { ...shared, J_PARTNER_NAME: b.name }),
    },
    {
      label: "A reaches the couple home (Check again fallback)",
      critical: true,
      run: () => runMaestro(a.device, "04b-check-again.yaml", { ...shared, J_PARTNER_NAME: b.name }),
    },
    {
      label: "B sends a 'miss you' pulse; A gets it live on another tab",
      run: () => {
        const note = `Missing you from London ${runId}`;
        return watchWhileActing(
          (onReady) =>
            runMaestro(
              a.device,
              "05-pulse-receive.yaml",
              {
                ...shared,
                J_PARTNER_NAME: b.name,
                J_PULSE_RECEIVED_TITLE: `${b.name} misses you`,
                J_PULSE_NOTE: note,
              },
              { onReady }
            ),
          () =>
            runMaestro(b.device, "05-pulse-send.yaml", {
              ...shared,
              J_PULSE_BUTTON: "Send a miss you pulse",
              J_PULSE_SEND_LABEL: `Send miss you to ${a.name}`,
              J_PULSE_SENT_TITLE: `"Miss you" sent to ${a.name}`,
              J_PULSE_NOTE: note,
            })
        );
      },
    },
    {
      label: "A replies with a good night pulse; B gets it live",
      run: () => {
        const note = `Sleep well ${runId}`;
        return watchWhileActing(
          (onReady) =>
            runMaestro(
              b.device,
              "05-pulse-receive.yaml",
              {
                ...shared,
                J_PARTNER_NAME: a.name,
                J_PULSE_RECEIVED_TITLE: `Good night from ${a.name}`,
                J_PULSE_NOTE: note,
              },
              { onReady }
            ),
          () =>
            runMaestro(a.device, "05-pulse-send.yaml", {
              ...shared,
              J_PULSE_BUTTON: "Send a good night pulse",
              J_PULSE_SEND_LABEL: `Send good night to ${b.name}`,
              J_PULSE_SENT_TITLE: `Good night sent to ${b.name}`,
              J_PULSE_NOTE: note,
            })
        );
      },
    },
    {
      label: "A plans a reunion with date, time, and place",
      run: () => runMaestro(a.device, "06-reunion-set.yaml", { ...shared, J_MEETUP_LOCATION: "Goa" }),
    },
    {
      label: "B sees the reunion after refreshing, then clears it",
      run: () =>
        runMaestro(b.device, "06-reunion-verify-and-clear.yaml", { ...shared, J_MEETUP_LOCATION: "Goa" }),
    },
    {
      label: "A sees the cleared reunion after refreshing",
      run: () => runMaestro(a.device, "06-reunion-cleared-seen.yaml", shared),
    },
    {
      label: "A answers today's ritual first and sees it locked",
      run: () =>
        runMaestro(a.device, "07-ritual-answer-first.yaml", {
          ...shared,
          J_PARTNER_NAME: b.name,
          J_RITUAL_ANSWER: `Asha ritual answer ${runId}`,
        }),
    },
    {
      label: "B answers second and both answers reveal",
      run: () =>
        runMaestro(b.device, "07-ritual-answer-second.yaml", {
          ...shared,
          J_RITUAL_ANSWER: `Ravi ritual answer ${runId}`,
          J_PARTNER_RITUAL_ANSWER: `Asha ritual answer ${runId}`,
        }),
    },
    {
      label: "A sees the reveal live and opens it from the timeline",
      run: () =>
        runMaestro(a.device, "07-ritual-revealed-live.yaml", {
          ...shared,
          J_RITUAL_ANSWER: `Asha ritual answer ${runId}`,
          J_PARTNER_RITUAL_ANSWER: `Ravi ritual answer ${runId}`,
        }),
    },
    {
      label: "A creates a capsule with a custom unlock time; B watches it arrive locked",
      run: () =>
        watchWhileActing(
          (onReady) =>
            runMaestro(
              b.device,
              "08-capsule-locked-for-partner.yaml",
              {
                ...shared,
                J_CAPSULE_TITLE: capsuleTitle,
                J_CAPSULE_NOTE: capsuleNote,
                J_CAPSULE_CONTEXT: "Nervous and happy",
              },
              { onReady }
            ),
          () =>
            runMaestro(a.device, "08-capsule-create.yaml", {
              ...shared,
              J_CAPSULE_TITLE: capsuleTitle,
              J_CAPSULE_NOTE: capsuleNote,
              J_CAPSULE_CONTEXT: "Nervous and happy",
            })
        ),
    },
    {
      label: "B opens the capsule once it unlocks",
      run: async () => {
        await unlockCapsule(admin, capsuleTitle);
        await runMaestro(b.device, "08-capsule-open.yaml", {
          ...shared,
          J_CAPSULE_TITLE: capsuleTitle,
          J_CAPSULE_EXPECTED_CONTENT: capsuleNote,
        });
      },
    },
    {
      label: "A sees the capsule marked opened",
      run: () =>
        runMaestro(a.device, "08-capsule-opened-for-creator.yaml", {
          ...shared,
          J_CAPSULE_TITLE: capsuleTitle,
          J_CAPSULE_EXPECTED_CONTENT: capsuleNote,
        }),
    },
    {
      label: "B creates a photo capsule with the in-app camera",
      run: () => runMaestro(b.device, "09-photo-capsule-create.yaml", { ...shared, J_CAPSULE_TITLE: photoCapsuleTitle }),
    },
    {
      label: "A opens the photo capsule and the private photo loads",
      run: async () => {
        await unlockCapsule(admin, photoCapsuleTitle);
        await runMaestro(a.device, "08-capsule-open.yaml", {
          ...shared,
          J_CAPSULE_TITLE: photoCapsuleTitle,
          J_CAPSULE_EXPECTED_CONTENT: "Capsule photo",
        });
      },
    },
    {
      label: "B deletes the photo capsule; A sees it disappear live",
      run: () =>
        watchWhileActing(
          (onReady) =>
            runMaestro(
              a.device,
              "09-capsule-deleted-for-partner.yaml",
              { ...shared, J_CAPSULE_TITLE: photoCapsuleTitle },
              { onReady }
            ),
          () => runMaestro(b.device, "09-capsule-delete.yaml", { ...shared, J_CAPSULE_TITLE: photoCapsuleTitle })
        ),
    },
    {
      label: "A's timeline lists every kind of moment",
      run: () => runMaestro(a.device, "10-timeline.yaml", shared),
    },
    {
      label: "B's timeline lists every kind of moment",
      run: () => runMaestro(b.device, "10-timeline.yaml", shared),
    },
    {
      label: "A edits profile, emotional, quiet hours, notification, and couple settings",
      run: () =>
        runMaestro(a.device, "11-settings.yaml", {
          ...shared,
          J_EMAIL: a.email,
          J_CITY: "Mumbai",
          J_NEW_NAME: a.newName,
        }),
    },
    {
      label: "B sees A's new name and the shared couple settings",
      run: () =>
        runMaestro(b.device, "11-partner-sees-settings.yaml", { ...shared, J_PARTNER_NEW_NAME: a.newName }),
    },
    {
      label: "B enables notifications and requests a data export",
      run: () => runMaestro(b.device, "12-notifications-and-export.yaml", shared),
    },
    {
      label: "A unpairs and archives the couple space",
      critical: true,
      run: () => runMaestro(a.device, "13-unpair.yaml", shared),
    },
    {
      label: "B is moved out of the archived space",
      run: () => runMaestro(b.device, "13-partner-after-unpair.yaml", shared),
    },
    {
      label: "A creates a new couple space",
      critical: true,
      run: () => runMaestro(a.device, "02-create-couple.yaml", { ...shared, J_WITH_ANNIVERSARY: "0" }),
    },
    {
      label: "B rejoins through the invite link",
      critical: true,
      run: async () => {
        state.inviteCode = await getActiveInviteCode(admin, a.email);
        await runMaestro(b.device, "14-join-via-link.yaml", {
          ...shared,
          J_INVITE_CODE: state.inviteCode,
          J_INVITE_LINK: `tara://${state.inviteCode}`,
          J_PARTNER_NAME: a.newName,
        });
      },
    },
    {
      label: "A's waiting screen unlocks on its own after the rejoin",
      run: () => runMaestro(a.device, "04-waiting-unlocks.yaml", { ...shared, J_PARTNER_NAME: b.name }),
    },
    {
      label: "A reaches the new couple home (Check again fallback)",
      run: () => runMaestro(a.device, "04b-check-again.yaml", { ...shared, J_PARTNER_NAME: b.name }),
    },
    {
      label: "B signs out, is refused a duplicate sign-up, and signs back in",
      run: () =>
        runMaestro(b.device, "15-session.yaml", { ...shared, J_EMAIL: b.email, J_PARTNER_NAME: a.newName }),
    },
    {
      label: "A opens an unknown link and gets back home",
      run: () => runMaestro(a.device, "16-not-found.yaml", shared),
    },
  ];

  const results = [];
  try {
    await Promise.all([prepareDevice(a.device), prepareDevice(b.device)]);

    for (const [index, step] of steps.entries()) {
      const number = index + 1;
      if (number < fromStep) {
        continue;
      }

      console.log(`\n=== STEP ${number}: ${step.label} ===`);
      await stopStrayMaestro([a.device, b.device]);
      const startedAt = Date.now();
      try {
        await step.run();
        results.push({ number, label: step.label, status: "passed", seconds: (Date.now() - startedAt) / 1000 });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`STEP ${number} FAILED: ${message}`);
        results.push({ number, label: step.label, status: "failed", error: message });
        if (step.critical) {
          console.error("Critical step failed; later steps depend on it, stopping.");
          break;
        }
      }
    }
  } finally {
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(
      path.join(outputDir, `journey-${runId}.json`),
      `${JSON.stringify({ runId, a: a.email, b: b.email, results }, null, 2)}\n`
    );

    if (keepData) {
      console.log(`\nKeeping journey data for run ${runId}`);
    } else {
      await run("node", ["scripts/e2e/supabase-e2e-data.mjs", "cleanup", "--run-id", runId]);
    }
  }

  console.log("\n==== JOURNEY SUMMARY ====");
  for (const result of results) {
    console.log(`${result.status === "passed" ? "PASS" : "FAIL"}  ${result.number}. ${result.label}`);
  }
  const failed = results.filter((result) => result.status === "failed");
  console.log(`\n${results.length - failed.length}/${results.length} steps passed.`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
