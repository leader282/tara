import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(new URL("../..", import.meta.url).pathname);
const outputDir = path.join(repoRoot, ".maestro", ".e2e-data");
const emailDomain = "example.com";
const emailPrefix = "tara.e2e";
const plusEmailPrefix = "tara.e2e+";
const defaultPassword = "TaraE2E!123";

function loadDotEnv() {
  const envPath = path.join(repoRoot, ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const envText = readFileSync(envPath, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    if (!key || process.env[key]) {
      continue;
    }

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

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
  const requestedRunId = getArg("--run-id") ?? process.env.E2E_RUN_ID;
  if (requestedRunId) {
    const sanitized = sanitizeRunId(requestedRunId);
    if (sanitized) {
      return sanitized;
    }
  }

  return sanitizeRunId(new Date().toISOString());
}

function requireEnv(name, fallbacks = []) {
  for (const key of [name, ...fallbacks]) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }

  throw new Error(`Missing ${name}. Set it in the shell or .env before running E2E data setup.`);
}

function createAdminClient() {
  loadDotEnv();

  const supabaseUrl = requireEnv("E2E_SUPABASE_URL", [
    "SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_URL",
  ]);
  const serviceRoleKey = requireEnv("E2E_SUPABASE_SERVICE_ROLE_KEY", [
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_KEY",
  ]);

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function buildEmail(runId, role) {
  return `${emailPrefix}.${runId}.${role}@${emailDomain}`;
}

function buildInviteCode(runId, label) {
  // On-device keyboards (e.g. GBoard) predictively auto-complete real words
  // ("INVITE" -> "INVITED"), which corrupts the code while Maestro types it.
  // Replace vowels with look-alike digits so no segment is ever a predictable
  // dictionary word (the leading digit also defeats prediction), while keeping
  // the label readable. The same value is seeded and typed, so they always match.
  const vowelDigits = { A: "4", E: "3", I: "1", O: "0", U: "7" };
  const safeLabel = label.toUpperCase().replace(/[AEIOU]/g, (vowel) => vowelDigits[vowel]);
  const code = `E2E_${runId}_${safeLabel}`.replace(/[^A-Za-z0-9_-]/g, "").toUpperCase();
  return code.padEnd(16, "X").slice(0, 64);
}

function tomorrowIso() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  date.setUTCHours(10, 30, 0, 0);
  return date.toISOString();
}

function yesterdayIso() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  date.setUTCHours(10, 30, 0, 0);
  return date.toISOString();
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function outputPathForRun(runId) {
  return path.join(outputDir, `${runId}.json`);
}

async function throwIfError(resultPromise, action) {
  const result = await resultPromise;

  if (result.error) {
    throw new Error(`${action}: ${result.error.message}`);
  }

  return result.data;
}

async function listE2EUsers(client, runId = null) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) {
      throw new Error(`List auth users: ${error.message}`);
    }

    const pageUsers = data.users ?? [];
    users.push(
      ...pageUsers.filter((user) => {
        const email = user.email ?? "";
        if (runId) {
          return email.startsWith(`${emailPrefix}.${runId}.`);
        }

        return email.startsWith(`${emailPrefix}.`) || email.startsWith(plusEmailPrefix);
      })
    );

    if (pageUsers.length < 1000) {
      break;
    }

    page += 1;
  }

  return users;
}

async function deleteWhereIn(client, table, column, values) {
  if (values.length === 0) {
    return;
  }

  await throwIfError(
    client.from(table).delete().in(column, values),
    `Delete ${table}.${column}`
  );
}

async function cleanupRun(client, runId = null) {
  const users = await listE2EUsers(client, runId);
  const userIds = users.map((user) => user.id);

  let coupleIds = [];
  if (userIds.length > 0) {
    const memberRows = await throwIfError(
      client.from("couple_members").select("couple_id").in("user_id", userIds),
      "Load E2E couple memberships"
    );
    const createdRows = await throwIfError(
      client.from("couples").select("id").in("created_by", userIds),
      "Load E2E created couples"
    );
    coupleIds = [
      ...new Set([
        ...(memberRows ?? []).map((row) => row.couple_id),
        ...(createdRows ?? []).map((row) => row.id),
      ]),
    ];
  }

  await deleteWhereIn(client, "privacy_safety_events", "user_id", userIds);
  await deleteWhereIn(client, "privacy_safety_events", "couple_id", coupleIds);
  await deleteWhereIn(client, "account_deletion_requests", "user_id", userIds);
  await deleteWhereIn(client, "data_export_requests", "user_id", userIds);
  await deleteWhereIn(client, "couples", "id", coupleIds);
  await deleteWhereIn(client, "profiles", "id", userIds);
  await deleteWhereIn(client, "user_settings", "user_id", userIds);
  await deleteWhereIn(client, "notification_preferences", "user_id", userIds);

  const templatePattern = runId ? `E2E ${runId}%` : "E2E %";
  await throwIfError(
    client.from("ritual_templates").delete().ilike("title", templatePattern),
    "Delete E2E ritual templates"
  );

  for (const user of users) {
    const { error } = await client.auth.admin.deleteUser(user.id);
    if (error && !error.message.toLowerCase().includes("not found")) {
      throw new Error(`Delete auth user ${user.email}: ${error.message}`);
    }
  }

  return {
    couplesDeleted: coupleIds.length,
    usersDeleted: users.length,
  };
}

async function createUser(client, runId, role, displayName, password) {
  const email = buildEmail(runId, role);
  const { data, error } = await client.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: {
      e2e_run_id: runId,
      e2e_role: role,
    },
  });

  if (error) {
    throw new Error(`Create auth user ${email}: ${error.message}`);
  }

  const userId = data.user?.id;
  if (!userId) {
    throw new Error(`Create auth user ${email}: Supabase did not return a user id.`);
  }

  await throwIfError(
    client.from("profiles").upsert({
      id: userId,
      display_name: displayName,
      timezone: "Asia/Kolkata",
      city: "Mumbai",
      country: "India",
      onboarding_completed: true,
    }),
    `Upsert profile for ${email}`
  );
  await throwIfError(
    client.from("user_settings").upsert({
      user_id: userId,
      emotional_tone: "soft",
      notification_tone: "gentle",
      preferred_love_signals: ["thinking_of_you", "hug"],
      quiet_hours_start: "22:00",
      quiet_hours_end: "07:00",
    }),
    `Upsert user settings for ${email}`
  );
  await throwIfError(
    client.from("notification_preferences").upsert({
      user_id: userId,
      presence_enabled: true,
      rituals_enabled: true,
      capsules_enabled: true,
      countdown_enabled: true,
      quiet_hours_enabled: true,
    }),
    `Upsert notification preferences for ${email}`
  );

  return {
    email,
    id: userId,
    displayName,
  };
}

async function createCouple(client, params) {
  const [couple] = await throwIfError(
    client
      .from("couples")
      .insert({
        anniversary_date: "2024-02-14",
        created_by: params.createdBy.id,
        next_meetup_at: tomorrowIso(),
        next_meetup_location: params.location,
      })
      .select("id")
      .single(),
    `Create ${params.label} couple`
  ).then((row) => [row]);

  await throwIfError(
    client.from("couple_settings").insert({
      couple_id: couple.id,
      ritual_frequency: "daily",
      privacy_level: "private",
    }),
    `Create ${params.label} couple settings`
  );

  const members = params.members.map((member) => ({
    couple_id: couple.id,
    user_id: member.id,
    role: "partner",
    status: "active",
  }));
  await throwIfError(
    client.from("couple_members").insert(members),
    `Create ${params.label} couple members`
  );

  return couple.id;
}

async function seedRitual(client, runId, coupleId) {
  const template = await throwIfError(
    client
      .from("ritual_templates")
      .insert({
        title: `E2E ${runId} daily check-in`,
        category: "daily_checkin",
        prompt: "What is one tiny thing that helped you feel close today?",
        input_type: "text",
        is_active: true,
      })
      .select("id")
      .single(),
    "Create E2E ritual template"
  );

  const ritual = await throwIfError(
    client
      .from("couple_rituals")
      .insert({
        couple_id: coupleId,
        ritual_template_id: template.id,
        scheduled_for: todayDateOnly(),
        status: "scheduled",
      })
      .select("id")
      .single(),
    "Create E2E couple ritual"
  );

  return {
    coupleRitualId: ritual.id,
    templateId: template.id,
  };
}

async function seedCapsules(client, runId, coupleId, owner) {
  const readyCapsule = await throwIfError(
    client
      .from("memory_capsules")
      .insert({
        couple_id: coupleId,
        creator_id: owner.id,
        title: `E2E ${runId} ready capsule`,
        unlock_type: "date",
        unlock_at: yesterdayIso(),
        emotional_context: "E2E ready to open",
      })
      .select("id")
      .single(),
    "Create E2E ready capsule"
  );

  await throwIfError(
    client.from("memory_capsule_contents").insert({
      capsule_id: readyCapsule.id,
      note: `E2E ${runId} opened capsule note`,
    }),
    "Create E2E ready capsule content"
  );

  const lockedCapsule = await throwIfError(
    client
      .from("memory_capsules")
      .insert({
        couple_id: coupleId,
        creator_id: owner.id,
        title: `E2E ${runId} future capsule`,
        unlock_type: "date",
        unlock_at: tomorrowIso(),
        emotional_context: "E2E future memory",
      })
      .select("id")
      .single(),
    "Create E2E future capsule"
  );

  await throwIfError(
    client.from("memory_capsule_contents").insert({
      capsule_id: lockedCapsule.id,
      note: `E2E ${runId} future capsule note`,
    }),
    "Create E2E future capsule content"
  );

  return {
    readyCapsuleId: readyCapsule.id,
    readyCapsuleTitle: `E2E ${runId} ready capsule`,
    lockedCapsuleId: lockedCapsule.id,
    lockedCapsuleTitle: `E2E ${runId} future capsule`,
  };
}

async function setupRun(client, runId) {
  await cleanupRun(client, runId);

  const password = process.env.E2E_PASSWORD ?? defaultPassword;
  const users = {
    owner: await createUser(client, runId, "owner", "Tara E2E Owner", password),
    partner: await createUser(client, runId, "partner", "Tara E2E Partner", password),
    waitingOwner: await createUser(client, runId, "waiting-owner", "Tara E2E Waiting", password),
    invitee: await createUser(client, runId, "invitee", "Tara E2E Invitee", password),
    safetyOwner: await createUser(client, runId, "safety-owner", "Tara E2E Safety", password),
    safetyPartner: await createUser(client, runId, "safety-partner", "Tara E2E Safety Partner", password),
  };

  const pairedCoupleId = await createCouple(client, {
    label: "paired",
    createdBy: users.owner,
    members: [users.owner, users.partner],
    location: "E2E Reunion City",
  });
  const waitingCoupleId = await createCouple(client, {
    label: "waiting",
    createdBy: users.waitingOwner,
    members: [users.waitingOwner],
    location: "E2E Invite City",
  });
  const safetyCoupleId = await createCouple(client, {
    label: "safety",
    createdBy: users.safetyOwner,
    members: [users.safetyOwner, users.safetyPartner],
    location: "E2E Safety City",
  });

  const inviteCode = buildInviteCode(runId, "INVITE");
  await throwIfError(
    client.from("couple_invites").insert({
      couple_id: waitingCoupleId,
      created_by: users.waitingOwner.id,
      invite_code: inviteCode,
      status: "active",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }),
    "Create E2E invite"
  );

  const seededRitual = await seedRitual(client, runId, pairedCoupleId);
  const seededCapsules = await seedCapsules(client, runId, pairedCoupleId, users.owner);

  const runData = {
    runId,
    password,
    users,
    couples: {
      pairedCoupleId,
      waitingCoupleId,
      safetyCoupleId,
    },
    invite: {
      code: inviteCode,
      invalidCode: buildInviteCode(runId, "INVALID"),
    },
    seededRitual,
    seededCapsules,
    smokeEmail: `${plusEmailPrefix}${runId}@${emailDomain}`,
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPathForRun(runId), `${JSON.stringify(runData, null, 2)}\n`);

  return runData;
}

async function main() {
  const action = process.argv[2] ?? "setup";
  const runId = getRunId();
  const client = createAdminClient();

  if (action === "setup") {
    const data = await setupRun(client, runId);
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (action === "cleanup") {
    const cleanupAll = hasFlag("--all");
    const result = await cleanupRun(client, cleanupAll ? null : runId);
    console.log(JSON.stringify({ runId: cleanupAll ? "all" : runId, ...result }, null, 2));
    return;
  }

  throw new Error(`Unknown action "${action}". Use setup or cleanup.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
