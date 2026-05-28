param(
    [string]$ShortPath = "C:\jdr_real",
    [switch]$SkipCopy,
    [string]$DeviceSerial
)

$ErrorActionPreference = "Stop"

$SourcePath = Split-Path -Parent $MyInvocation.MyCommand.Path
$AndroidSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$Adb = Join-Path $AndroidSdk "platform-tools\adb.exe"
$JavaHome = "C:\Program Files\Android\Android Studio\jbr"

if (-not (Test-Path $Adb)) {
    throw "No se encontro adb en $Adb"
}

if (-not (Test-Path $JavaHome)) {
    throw "No se encontro Java (Android Studio JBR) en $JavaHome"
}

if (-not $SkipCopy) {
    if (-not (Test-Path $ShortPath)) {
        New-Item -ItemType Directory -Path $ShortPath | Out-Null
    }

    Write-Host "Copiando proyecto a ruta corta..." -ForegroundColor Cyan
    robocopy "$SourcePath" "$ShortPath" /MIR /XD node_modules android\build android\.gradle ios\Pods .git > $null
    if ($LASTEXITCODE -ge 8) {
        throw "Fallo robocopy con codigo $LASTEXITCODE"
    }
}

Write-Host "Instalando dependencias npm..." -ForegroundColor Cyan
npm install --prefix "$ShortPath"

# Clean stale native build artifacts that can break ninja on Windows.
$staleDirs = @(
    (Join-Path $ShortPath "android\.cxx"),
    (Join-Path $ShortPath "android\build"),
    (Join-Path $ShortPath "node_modules\react-native-gesture-handler\android\.cxx"),
    (Join-Path $ShortPath "node_modules\react-native-screens\android\.cxx"),
    (Join-Path $ShortPath "node_modules\react-native-safe-area-context\android\.cxx")
)
foreach ($dir in $staleDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir
    }
}

$env:JAVA_HOME = $JavaHome
$env:ANDROID_HOME = $AndroidSdk
$env:ANDROID_SDK_ROOT = $AndroidSdk
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

Write-Host "Compilando APK debug..." -ForegroundColor Cyan
Push-Location (Join-Path $ShortPath "android")
try {
    .\gradlew.bat clean assembleDebug -PreactNativeArchitectures=arm64-v8a
}
finally {
    Pop-Location
}

$Apk = Join-Path $ShortPath "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $Apk)) {
    throw "No se encontro APK en $Apk"
}

Write-Host "Esperando tablet para instalar..." -ForegroundColor Cyan
if (-not $DeviceSerial) {
    $connected = & "$Adb" devices | Select-Object -Skip 1 | Where-Object { $_ -match "\S+\s+device$" } | ForEach-Object { ($_ -split "\s+")[0] }
    $physical = $connected | Where-Object { $_ -notmatch "^emulator-" }
    if ($physical.Count -eq 1) {
        $DeviceSerial = $physical[0]
    }
    elseif ($connected.Count -eq 1) {
        $DeviceSerial = $connected[0]
    }
    else {
        throw "Hay varios dispositivos conectados. Ejecuta con -DeviceSerial <serial>."
    }
}

& "$Adb" -s "$DeviceSerial" wait-for-device
& "$Adb" -s "$DeviceSerial" install -r "$Apk"
if ($LASTEXITCODE -ne 0) {
    throw "Fallo la instalacion adb en el dispositivo $DeviceSerial"
}

Write-Host "Instalacion completada." -ForegroundColor Green
