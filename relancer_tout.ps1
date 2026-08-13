# 1. Ferme les anciens serveurs (frontend Node ET backend Python) pour ne rien bloquer
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# 2. Trouve le zip le plus recemment telecharge
$zip = Get-ChildItem "$env:USERPROFILE\Downloads\truthlens-ai-ameliore*.zip" -ErrorAction Stop |
       Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "Zip utilise : $($zip.Name) (modifie le $($zip.LastWriteTime))"

# 3. Extrait dans un NOUVEAU dossier horodate (pas de suppression = pas de fichier verrouille)
$stamp = Get-Date -Format "MMdd-HHmm"
$dest = "$env:USERPROFILE\Downloads\truthlens-$stamp"
Expand-Archive -Path $zip.FullName -DestinationPath $dest -Force
Set-Location $dest

# 4. Verifie que le correctif de la virgule manquante est bien present avant de lancer quoi que ce soit
$content = Get-Content "src\translations.js" -Raw
if ($content -match '\}\s*\n\s*\{\s*\n\s*question:') {
    Write-Host ""
    Write-Host "ATTENTION : ce zip contient ENCORE le bug de virgule manquante." -ForegroundColor Red
    Write-Host "Retelechargez le dernier fichier truthlens-ai-ameliore.zip depuis la conversation, puis relancez ce script." -ForegroundColor Red
    Write-Host ""
    exit 1
}
Write-Host "Verification OK : le correctif est present dans ce zip." -ForegroundColor Green

# 5. Installe et lance
npm install
npm run dev
