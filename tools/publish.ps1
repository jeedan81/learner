# Publish the learner app to GitHub Pages (jeedan81/learner, public repo).
# Run from the learner folder:  powershell -ExecutionPolicy Bypass -File .\tools\publish.ps1
# Only app files are uploaded. Learning records live in the private repo jeedan81/learner-data.
# (ASCII only on purpose: Windows PowerShell 5.1 misreads UTF-8 scripts without a BOM.)
Set-Location (Split-Path $PSScriptRoot -Parent)

$me = gh api user --jq .login 2>$null
if ($me -ne 'jeedan81') {
  Write-Host 'GitHub login needed. A browser page will open: paste the code shown, then Authorize.'
  gh auth login --hostname github.com --git-protocol https --web
  if ($LASTEXITCODE -ne 0) { Write-Host 'Login failed.'; exit 1 }
}

node tools/build-sw.js
git add -A
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { git commit -q -m 'Update learner app' }

gh repo view jeedan81/learner *> $null
if ($LASTEXITCODE -ne 0) {
  gh repo create jeedan81/learner --public --description 'Learner: talk, math, science, history' --source . --remote origin --push
  if ($LASTEXITCODE -ne 0) { Write-Host 'Failed to create the repo.'; exit 1 }
  gh api -X POST repos/jeedan81/learner/pages -f 'source[branch]=main' -f 'source[path]=/' | Out-Null
} else {
  git push origin main
  if ($LASTEXITCODE -ne 0) { Write-Host 'Push failed.'; exit 1 }
}
Write-Host ''
Write-Host 'Done. In 1-2 minutes: https://jeedan81.github.io/learner/'
