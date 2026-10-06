package analyze

import (
	"sort"
	"strings"
)

// Explanation documents one rule for `safe-install explain`.
type Explanation struct {
	ID, Title, Why, Fix string
}

var explanations = []Explanation{
	{"SI-SCR-001", "Package runs install scripts",
		"preinstall/install/postinstall scripts run arbitrary code on your machine during install. Most malicious packages use them.",
		"Read the script. If it is expected (native builds, binary downloads from the project's own release), approve it: safe-install approve <pkg>."},
	{"SI-SCR-002", "Install script downloads and executes code",
		"Piping a download into a shell (curl | sh, iwr | iex, encoded PowerShell) runs code nobody reviewed, fetched at install time.",
		"Do not approve. Find out why the package does this; report it to the registry if it looks malicious."},
	{"SI-SCR-003", "Install script evaluates dynamic or encoded code",
		"eval, new Function and long encoded blobs are how malware hides its payload from review.",
		"Inspect the decoded code before approving. Legitimate install scripts rarely need this."},
	{"SI-SCR-004", "Install script touches credentials",
		"Reading ~/.ssh, ~/.npmrc, cloud credentials or token variables during install is the classic way to steal secrets.",
		"Do not approve unless you understand exactly why the package needs them."},
	{"SI-SCR-005", "Install scripts changed since approval",
		"The scripts, or the files they run, differ from what was approved, as happens when a package is compromised.",
		"Review the new scripts, then approve again: safe-install approve <pkg>."},
	{"SI-REC-001", "Version published recently",
		"Compromised releases are usually caught and unpublished within days. Waiting minReleaseAge before using a version avoids most of them.",
		"Wait, pin an older version, or exempt a trusted fast-moving package with minReleaseAgeExclude in .safe-install.json."},
	{"SI-REC-002", "Unusual publisher on a recent release",
		"A release published without the provenance its predecessor had, or by someone who never published the package before, is what a stolen token looks like.",
		"Check the package's repository and release notes for this version before using it."},
	{"SI-POP-001", "Name imitates a popular package",
		"Typosquats (lodahs, expres, re-act) rely on a typo in package.json to get installed instead of the real package.",
		"Check the spelling. If you meant the popular package, fix the name; if this one is intended, verify its repository first."},
	{"SI-POP-002", "Rarely used package runs install scripts",
		"Malware is often published as a new, barely downloaded package whose install script does the damage.",
		"Make sure you know why this package is in your tree and read its script before approving."},
	{"SI-VUL-001", "Known advisory",
		"OSV lists this version as malicious (MAL-…, blocked) or vulnerable. Vulnerabilities count one level below their advisory severity; npm audit covers them in depth.",
		"For a malicious package: remove it and rotate any credentials on machines that installed it. For a vulnerability: upgrade to a fixed version."},
	{"SI-CODE-001", "Package code downloads and executes code",
		"The package's own JavaScript, which runs when your app imports it, starts a downloader (curl, wget, PowerShell) or evaluates data fetched from the network. Install-script checks never see this.",
		"Do not ship it: remove the package or pin a version without this code, and check whether the code already ran (safe-install why <pkg> shows what pulls it in)."},
	{"SI-CODE-002", "Package code sends credentials over the network",
		"The package's code reads credentials (~/.ssh, ~/.npmrc, cloud configs, token variables) right next to a network send: the shape of credential theft.",
		"Remove the package. If your app or tests imported it, rotate the credentials it could reach."},
	{"SI-CODE-003", "Package code is obfuscated",
		"javascript-obfuscator naming, or a large encoded blob passed straight to eval or Function, hides what the code does from review.",
		"Find out why a dependency ships obfuscated code; prefer an alternative unless the publisher explains it."},
	{"SI-MON-001", "Install script connected to the network",
		"Seen by the runtime monitor (--monitor, Linux). Some packages download binaries; malware phones home or fetches a payload.",
		"Check the destination is the project's own release host. If not, remove the package and treat the machine as exposed."},
	{"SI-MON-002", "Install script ran a network tool",
		"curl, wget, nc, ssh and similar are how scripts download payloads or exfiltrate data.",
		"Read what was run (shown in full). Approve only if it fetches the project's own artifacts."},
	{"SI-MON-003", "Install script read credentials",
		"Reading ~/.ssh, ~/.npmrc, cloud or browser credentials during install is credential theft.",
		"Assume the secrets are stolen: rotate them, then remove the package."},
	{"SI-MON-004", "Install script touched a persistence location",
		"Writing shell startup files, ~/.ssh, autostart or systemd units, git hooks or system directories lets malware survive the install.",
		"Inspect and restore the file, remove the package. --monitor=kill stops the script after the first such action."},
	{"SI-MON-005", "Install script wrote outside the project",
		"Install scripts normally write only to their own directory, temp and package caches.",
		"Check what was written and why."},
	{"SI-POL-001", "Blocked by policy",
		"Your organization's (or project's) policy lists this package in blockPackages: it must not be installed, and its scripts never run.",
		"Remove the package or replace it. If the block is wrong, change it in the policy that sets it (safe-install shows the organization policy in use)."},
	{"SI-DEP-001", "Deprecated or missing version",
		"Deprecated versions get no fixes; a version missing from the registry was likely unpublished, sometimes for being malicious.",
		"Upgrade to a supported version."},
	{"SI-INT-001", "Lockfile hash does not match the registry",
		"The tarball your lockfile expects is not the one the registry serves: the lockfile was edited or the package was tampered with.",
		"Do not install. Regenerate the lockfile from a trusted state and find out how it changed."},
	{"SI-INT-002", "Package downloaded from outside the registry",
		"A lockfile entry pointing at another host can serve anything, bypassing the registry.",
		"Make sure the URL is expected (a private mirror); otherwise regenerate the lockfile."},
}

// Explain returns the explanation for a rule ID (case-insensitive).
func Explain(id string) (Explanation, bool) {
	for _, e := range explanations {
		if strings.EqualFold(e.ID, id) {
			return e, true
		}
	}
	return Explanation{}, false
}

// Explanations returns every rule, sorted by ID.
func Explanations() []Explanation {
	out := append([]Explanation(nil), explanations...)
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}
