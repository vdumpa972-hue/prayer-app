@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "PARENT_DIR=%~dp0.."
set "ZIP_DIR=%PARENT_DIR%\prayer-app-zips"

if not exist "%ZIP_DIR%" mkdir "%ZIP_DIR%"

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm-ss"') do set "TS=%%i"
set "ZIP_FILE=%ZIP_DIR%\prayer-app-source-tree-%TS%.zip"

echo =========================
echo Creating SMALL Prayer App source zip
echo =========================
echo Zip file: %ZIP_FILE%
echo.
echo Includes important source/config for web, Android, and iOS.
echo Excludes generated build junk: node_modules, .next, Android build/.gradle, iOS Pods/build/DerivedData, APK/AAB/IPA, signing files.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$ProgressPreference='SilentlyContinue';" ^
  "$src=(Get-Location).Path;" ^
  "$dest='%ZIP_FILE%';" ^
  "$tmp=Join-Path $src ('_source_zip_stage_' + [guid]::NewGuid().ToString());" ^
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
  "Write-Host ('Files included: ' + $count + '  Source size before compression: ' + $mb + ' MB');" ^
  "Compress-Archive -Path (Join-Path $tmp '*') -DestinationPath $dest -Force;" ^
  "Remove-Item $tmp -Recurse -Force;" ^
  "Write-Host ('Zip size: ' + [math]::Round((Get-Item $dest).Length/1MB,2) + ' MB')"

if errorlevel 1 (
  echo.
  echo ERROR: Could not create the source tree zip.
  pause
  exit /b 1
)

echo.
echo =========================
echo Small source tree zip completed
echo =========================
echo Saved to: %ZIP_FILE%
echo.
echo After unzip on another computer:
echo npm install
echo npm run build
echo npx cap sync android
echo npx cap sync ios
echo.
pause
endlocal
