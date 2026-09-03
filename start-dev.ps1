$projectPath = "C:\Users\Victor\Downloads\comparateur de prix cs2"

Write-Host "Démarrage de Docker (Postgres + Adminer)..."
Set-Location $projectPath
docker compose up -d
Start-Sleep -Seconds 3
docker compose ps

Write-Host "`nLancement du serveur backend dans une nouvelle fenêtre..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath'; node server.js"

Write-Host "Lancement du frontend dans une nouvelle fenêtre..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath\frontend'; npm run dev"

Write-Host "`nTout est lancé. Ouvre http://localhost:5173 dans ton navigateur."
