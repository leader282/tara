import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function loadAverage(device) {
  const { stdout } = await execFileAsync("adb", ["-s", device, "shell", "cat", "/proc/loadavg"]);
  return Number(stdout.trim().split(/\s+/)[0]);
}

// A freshly booted (or freshly installed-to) emulator spends minutes on background work.
// Flows started in that window hit "isn't responding" dialogs, so wait for it to calm down.
export async function waitForDeviceToSettle(device, { maxLoad = 4, timeoutMs = 6 * 60_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const load = await loadAverage(device);
    if (load < maxLoad) {
      return;
    }
    if (Date.now() > deadline) {
      console.warn(`${device} is still busy (load ${load}); starting anyway.`);
      return;
    }
    console.log(`Waiting for ${device} to settle (load ${load})...`);
    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }
}
