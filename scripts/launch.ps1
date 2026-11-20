# Man Browser launch: publishes the newest draft release so downloads open.
# Runs from the "Man Browser launch" task in Windows Task Scheduler at 21 Nov 2026 19:00 (Israel time).
# Safe to run more than once: if nothing is a draft, it does nothing.  -DryRun only says what it would do.
param([switch]$DryRun)
$gh ='C:\Program Files\GitHub CLI\gh.exe'
$repo = 'manorkeshet417-code/man-browser'
$log = Join-Path $env:LOCALAPPDATA 'Man Browser launch.log'
function Log($m) { "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $m" | Add-Content -Path $log -Encoding utf8 }

try {
  $releases = & $gh release list --repo $repo --limit 50 --json tagName,isDraft,createdAt | ConvertFrom-Json
  $draft = $releases | Where-Object { $_.isDraft } | Sort-Object { [datetime]$_.createdAt } -Descending | Select-Object -First 1
  if (-not $draft) { Log 'nothing to publish (no draft release)'; exit 0 }
  if ($DryRun) { "would publish $($draft.tagName)"; exit 0 }
  & $gh release edit $draft.tagName --repo $repo --draft=false --latest | Out-Null
  if ($LASTEXITCODE -ne 0) { Log "FAILED to publish $($draft.tagName) (exit $LASTEXITCODE)"; exit 1 }
  Log "published $($draft.tagName): downloads are open"
} catch {
  Log "ERROR $($_.Exception.Message)"
  exit 1
}
