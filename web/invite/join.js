// The invite code travels after "#", so it never reaches this server or link-preview crawlers.
function readInviteCode() {
  try {
    const code = decodeURIComponent(window.location.hash.slice(1)).trim();
    return /^[A-Za-z0-9_-]{8,128}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

const code = readInviteCode();

if (code) {
  document.getElementById("invite").hidden = false;
  document.getElementById("code").textContent = code;

  // Chrome on Android opens other apps through intent links; elsewhere, use the app's scheme.
  document.getElementById("open").href = /Android/i.test(navigator.userAgent)
    ? `intent://${code}#Intent;scheme=tara;package=com.leader282.tara;end`
    : `tara://${code}`;

  document.getElementById("copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code);
      document.getElementById("copied").hidden = false;
    } catch {
      window.getSelection()?.selectAllChildren(document.getElementById("code"));
    }
  });
} else {
  document.getElementById("missing").hidden = false;
}
