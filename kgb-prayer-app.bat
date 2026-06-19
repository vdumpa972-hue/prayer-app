@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "KGB_DIR=C:\Users\vdumpa\backups\prayer-app\KGB"

if not exist "%KGB_DIR%" mkdir "%KGB_DIR%"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "TS=%%i"

set "POSTFIX="
set /p "POSTFIX=Enter KGB backup name postfix: "

set "NOTE="
set /p "NOTE=Enter KGB backup note: "

for /f "usebackq delims=" %%i in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$rawPostfix = $env:POSTFIX; $safePostfix = ($rawPostfix -replace '[^a-zA-Z0-9._ -]', '-').Trim(); $safePostfix = ($safePostfix -replace '\s+', '-'); if ([string]::IsNullOrWhiteSpace($safePostfix)) { $safePostfix = 'no-postfix' }; Write-Output $safePostfix"`) do set "SAFE_POSTFIX=%%i"

if not defined SAFE_POSTFIX (
  echo.
  echo ERROR: Could not prepare the KGB backup name.
  pause
  exit /b 1
)

set "BASE_NAME=kgb_%SAFE_POSTFIX%_%TS%"
set "ZIP_FILE=%KGB_DIR%\%BASE_NAME%.zip"
set "README_FILE=%KGB_DIR%\%BASE_NAME%.txt"

if exist "%ZIP_FILE%" (
  echo.
  echo ERROR: Backup already exists:
  echo %ZIP_FILE%
  pause
  exit /b 1
)

if exist "%README_FILE%" (
  echo.
  echo ERROR: README already exists:
  echo %README_FILE%
  pause
  exit /b 1
)

echo =========================
echo Creating Prayer App known good build source tree zip
echo =========================
echo Zip file: %ZIP_FILE%
echo README:   %README_FILE%

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$ProgressPreference='SilentlyContinue';" ^
  "$src = Get-Location;" ^
  "$dest = '%ZIP_FILE%';" ^
  "$readme = '%README_FILE%';" ^
  "$tmpName = '_source_zip_stage_' + [guid]::NewGuid().ToString();" ^
  "$tmp = Join-Path $src $tmpName;" ^
  "New-Item -ItemType Directory -Path $tmp | Out-Null;" ^
  "$exclude = @('node_modules','.next','.turbo','out','dist','coverage','.git','.vercel','source-zips','prayer-app-zips','backups',$tmpName);" ^
  "Get-ChildItem -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object { Copy-Item $_.FullName -Destination $tmp -Recurse -Force };" ^
  "Compress-Archive -Path (Join-Path $tmp '*') -DestinationPath $dest -Force;" ^
  "Remove-Item $tmp -Recurse -Force;" ^
  "$lines = @();" ^
  "$lines += 'Prayer App KGB Backup - Known Good Build';" ^
  "$lines += 'Date: ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss');" ^
  "$lines += 'Postfix: ' + $env:POSTFIX;" ^
  "$lines += 'Zip file: ' + [System.IO.Path]::GetFileName($dest);" ^
  "$lines += '';" ^
  "$lines += 'Note:';" ^
  "$lines += $env:NOTE;" ^
  "Set-Content -Path $readme -Value $lines -Encoding UTF8"

if errorlevel 1 (
  echo.
  echo ERROR: Could not create the KGB source tree zip or README.
  pause
  exit /b 1
)

echo.
echo =========================
echo KGB source tree zip completed
echo =========================
echo Saved to: %ZIP_FILE%
echo README:   %README_FILE%
echo.
echo This zip can be unzipped and rebuilt with npm install and npm run build.
echo.

pause
endlocal
