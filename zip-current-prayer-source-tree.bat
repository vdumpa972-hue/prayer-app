@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "PARENT_DIR=%~dp0.."
set "ZIP_DIR=%PARENT_DIR%\prayer-app-zips"

if not exist "%ZIP_DIR%" mkdir "%ZIP_DIR%"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "TS=%%i"
set "ZIP_FILE=%ZIP_DIR%\prayer-app-source-tree-%TS%.zip"

echo =========================
echo Creating current Prayer App source tree zip
echo =========================
echo Zip file: %ZIP_FILE%

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$ProgressPreference='SilentlyContinue';" ^
  "$src = Get-Location;" ^
  "$dest = '%ZIP_FILE%';" ^
  "$tmpName = '_source_zip_stage_' + [guid]::NewGuid().ToString();" ^
  "$tmp = Join-Path $src $tmpName;" ^
  "New-Item -ItemType Directory -Path $tmp | Out-Null;" ^
  "$exclude = @('node_modules','.next','.turbo','out','dist','coverage','.git','.vercel','source-zips','prayer-app-zips','backups','android','ios',$tmpName);" ^
  "Get-ChildItem -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object { Copy-Item $_.FullName -Destination $tmp -Recurse -Force };" ^
  "Compress-Archive -Path (Join-Path $tmp '*') -DestinationPath $dest -Force;" ^
  "Remove-Item $tmp -Recurse -Force"

if errorlevel 1 (
  echo.
  echo ERROR: Could not create the source tree zip.
  pause
  exit /b 1
)

echo.
echo =========================
echo Source tree zip completed
echo =========================
echo Saved to: %ZIP_FILE%
echo.
echo This zip excludes generated android/ios folders. Recreate them with: npx cap sync after npm install/build.
echo.

pause
endlocal
