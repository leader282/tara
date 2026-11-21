import { execFile } from "node:child_process";
import { mkdirSync, realpathSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DRIVER_PACKAGES = ["dev.mobile.maestro", "dev.mobile.maestro.test"];
const DRIVER_APKS = ["maestro-app.apk", "maestro-server.apk"];

// Pass to `maestro test` once installMaestroDriver has run for the device.
export const REUSE_DRIVER_ARG = "--no-reinstall-driver";

let driverApkDir = null;

function extractDriverApks() {
  driverApkDir ??= (async () => {
    const { stdout } = await execFileAsync("sh", ["-c", "command -v maestro"]);
    const maestroBin = realpathSync(stdout.trim());
    const clientJar = path.join(path.dirname(maestroBin), "..", "lib", "maestro-client.jar");
    const apkDir = path.join(os.tmpdir(), "tara-e2e-maestro-driver");
    mkdirSync(apkDir, { recursive: true });
    await execFileAsync("unzip", ["-o", "-q", "-j", clientJar, ...DRIVER_APKS, "-d", apkDir]);
    return apkDir;
  })();
  return driverApkDir;
}

// By default Maestro installs its Android driver at the start of every session and uninstalls
// it at the end. Every installed app reacts to those package changes, and on a loaded emulator
// that pushes the driver past its startup timeout. Installing the driver once, from the Maestro
// CLI in use, and running flows with REUSE_DRIVER_ARG avoids both.
export async function installMaestroDriver(device) {
  const apkDir = await extractDriverApks();
  for (const apk of DRIVER_APKS) {
    await execFileAsync("adb", ["-s", device, "install", "-r", "-t", path.join(apkDir, apk)]);
  }
}

// A Maestro run that is killed or times out leaves its `am instrument` session on the device.
// It keeps running the driver for a session that's gone and slows the next driver startup.
export async function stopMaestroDriverSession(device) {
  await execFileAsync("adb", ["-s", device, "shell", "pkill", "-f", "dev.mobile.maestro"]).catch(() => {});
  for (const driverPackage of DRIVER_PACKAGES) {
    await execFileAsync("adb", ["-s", device, "shell", "am", "force-stop", driverPackage]).catch(() => {});
  }
}
