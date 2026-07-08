@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "BACKUP_DIR=C:\Users\vdumpa\backups\prayer-app"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "TS=%%i"
set "BACKUP_FILE=%BACKUP_DIR%\prayer-app-%TS%.zip"

echo.
echo =========================
echo Creating SMALL backup including important Android/iOS files
echo =========================
echo Backup file: %BACKUP_FILE%
echo.
echo Includes web source, android source/config, ios source/config.
echo Excludes node_modules, .next, Android build/.gradle, iOS Pods/build/DerivedData, APK/AAB/IPA, signing/secrets.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$ProgressPreference='SilentlyContinue';" ^
  "$src=(Get-Location).Path;" ^
  "$dest='%BACKUP_FILE%';" ^
  "$tmp=Join-Path $src ('_backup_stage_' + [guid]::NewGuid().ToString());" ^
  "New-Item -ItemType Directory -Path $tmp | Out-Null;" ^
  "$skipTop=@('node_modules','.next','.turbo','out','dist','coverage','.git','.vercel','source-zips','prayer-app-zips','backups');" ^
  "$skipParts=@('.gradle','build','Pods','DerivedData','.symlinks','.idea','.vscode');" ^
  "$skipRelPrefixes=@('android\app\build\','android\build\','android\.gradle\','android\capacitor-cordova-android-plugins\build\','ios\Pods\','ios\App\build\','ios\build\','ios\DerivedData\','ios\.symlinks\');" ^
  "$skipNames=@('*.aab','*.apk','*.ipa','*.xcarchive','*.keystore','*.jks','*.p12','*.mobileprovision','*.DS_Store','tsconfig.tsbuildinfo','*.log','.env','.env.*');" ^
  "function SkipFile([System.IO.FileInfo]$f) {" ^
  "  $rel=$f.FullName.Substring($src.Length).TrimStart('\','/').Replace('/','\');" ^
  "  $first=($rel -split '\\')[0]; if ($skipTop -contains $first) { return $true }" ^
  "  foreach($p in $skipRelPrefixes){ if($rel.StartsWith($p,[System.StringComparison]::OrdinalIgnoreCase)){ return $true } }" ^
  "  foreach($part in ($rel -split '\\')){ if($skipParts -contains $part){ return $true } }" ^
  "  foreach($pat in $skipNames){ if($f.Name -like $pat){ return $true } }" ^
  "  if($rel.StartsWith('_source_zip_stage_') -or $rel.StartsWith('_backup_stage_')){ return $true }" ^
  "  return $false" ^
  "}" ^
  "$files=Get-ChildItem -LiteralPath $src -Recurse -Force -File | Where-Object { -not (SkipFile $_) };" ^
  "foreach($f in $files){" ^
  "  $rel=$f.FullName.Substring($src.Length).TrimStart('\','/');" ^
  "  $to=Join-Path $tmp $rel;" ^
  "  New-Item -ItemType Directory -Force -Path (Split-Path $to) | Out-Null;" ^
  "  Copy-Item -LiteralPath $f.FullName -Destination $to -Force;" ^
  "}" ^
  "$count=($files | Measure-Object).Count;" ^
  "$mb=[math]::Round((($files | Measure-Object Length -Sum).Sum/1MB),2);" ^
  "Write-Host ('Files backed up: ' + $count + '  Source size before compression: ' + $mb + ' MB');" ^
  "Compress-Archive -Path (Join-Path $tmp '*') -DestinationPath $dest -Force;" ^
  "Remove-Item $tmp -Recurse -Force;" ^
  "Write-Host ('Backup zip size: ' + [math]::Round((Get-Item $dest).Length/1MB,2) + ' MB')"

if errorlevel 1 (
  echo.
  echo ERROR: Backup failed.
  pause
  exit /b 1
)

echo Backup created successfully.
echo.

echo =========================
echo Clearing local build cache
echo =========================

if exist ".next" rmdir /s /q ".next"
if exist ".turbo" rmdir /s /q ".turbo"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

echo Cache cleanup finished.
echo.

echo =========================
echo Running Next.js build check
echo =========================

call npm run build

if errorlevel 1 (
  echo.
  echo ERROR: Build failed.
  echo Your backup is in: %BACKUP_FILE%
  pause
  exit /b 1
)

echo.
echo =========================
echo Syncing Capacitor Android and iOS
echo =========================

call npx cap sync android
if errorlevel 1 (
  echo.
  echo ERROR: npx cap sync android failed.
  pause
  exit /b 1
)

call npx cap sync ios
if errorlevel 1 (
  echo.
  echo WARNING: npx cap sync ios failed. If this Windows machine does not build iOS locally, this may be OK.
  echo Continue only if Codemagic/GitHub will build iOS from the committed ios folder.
)

echo.
echo =========================
echo Build Size Summary
echo =========================

for /f %%i in ('powershell -NoProfile -Command "if (Test-Path '.next') { [math]::Round(((Get-ChildItem '.next' -Recurse -File | Measure-Object Length -Sum).Sum / 1MB), 2) } else { 0 }"') do set "NEXT_SIZE_MB=%%i"

echo Approximate local build size ^(.next^): %NEXT_SIZE_MB% MB

echo.
echo Largest files in .next:
powershell -NoProfile -Command ^
  "if (Test-Path '.next') { $files = Get-ChildItem '.next' -Recurse -File | Sort-Object Length -Descending | Select-Object -First 10 FullName,@{Name='SizeMB';Expression={[math]::Round($_.Length / 1MB, 2)}}; if ($files) { $files | Format-Table -AutoSize } else { Write-Host 'No files found in .next' } } else { Write-Host '.next not found' }"

echo.
echo =========================
echo Build completed successfully
echo =========================
echo Backup saved to: %BACKUP_FILE%
echo This backup includes important android/ios source files, but excludes generated builds and signing/secrets.
echo.

echo =========================
echo Auto-deploy enabled: deploying to Vercel production now
echo =========================
echo.

where vercel >nul 2>nul
if errorlevel 1 (
  echo ERROR: Vercel CLI is not installed.
  echo Run: npm i -g vercel
  pause
  exit /b 1
)

echo =========================
echo Deploying to Vercel Production
echo =========================

vercel --prod

if errorlevel 1 (
  echo.
  echo ERROR: Vercel production deploy failed.
  pause
  exit /b 1
)

echo.
echo =========================
echo Production deploy completed
echo =========================
pause
endlocal
