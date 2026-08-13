Set-Location "$PSScriptRoot\backend"

if (!(Test-Path "venv")) {
    Write-Host "Premiere installation, ca peut prendre 1-2 minutes..."
    py -m venv venv
    & "venv\Scripts\python.exe" -m pip install --upgrade pip
    & "venv\Scripts\python.exe" -m pip install -r requirements.txt
}

if (!(Test-Path "truthlens.db")) {
    & "venv\Scripts\python.exe" seed.py
}

Write-Host ""
Write-Host "Demarrage du serveur sur http://localhost:8000 ..."
Write-Host "Laissez cette fenetre ouverte pendant toute la demo."
Write-Host ""
& "venv\Scripts\python.exe" -m uvicorn app.main:app --reload --port 8000
