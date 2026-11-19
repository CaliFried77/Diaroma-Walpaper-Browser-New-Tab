$ErrorActionPreference = "SilentlyContinue"
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing

# Win32 Media Key Fallback (Play/Pause, Next, Prev) + Stdin Command Queue
Add-Type -TypeDefinition @"
using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Runtime.InteropServices;

public static class MediaBridgeHelper {
    public const byte VK_MEDIA_NEXT_TRACK = 0xB0;
    public const byte VK_MEDIA_PREV_TRACK = 0xB1;
    public const byte VK_MEDIA_PLAY_PAUSE = 0xB3;
    private const uint KEYEVENTF_EXTENDEDKEY = 0x0001;
    private const uint KEYEVENTF_KEYUP = 0x0002;

    [DllImport("user32.dll", SetLastError = true)]
    private static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    public static ConcurrentQueue<string> Commands = new ConcurrentQueue<string>();
    public static AutoResetEvent WakeEvent = new AutoResetEvent(false);

    public static void SendMediaKey(byte vk) {
        keybd_event(vk, 0, KEYEVENTF_EXTENDEDKEY, UIntPtr.Zero);
        keybd_event(vk, 0, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, UIntPtr.Zero);
    }

    public static void StartStdinReader() {
        Thread t = new Thread(() => {
            try {
                string line;
                while ((line = Console.ReadLine()) != null) {
                    string trimmed = line.Trim();
                    if (trimmed.Length > 0) {
                        Commands.Enqueue(trimmed);
                        WakeEvent.Set();
                    }
                }
                Environment.Exit(0);
            } catch {
                Environment.Exit(0);
            }
        });
        t.IsBackground = true;
        t.Start();
    }
}
"@

[MediaBridgeHelper]::StartStdinReader()

[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]
[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSession,Windows.Media.Control,ContentType=WindowsRuntime]
[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties,Windows.Media.Control,ContentType=WindowsRuntime]
[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus,Windows.Media.Control,ContentType=WindowsRuntime]
[void][Windows.Storage.Streams.IRandomAccessStreamWithContentType,Windows.Storage.Streams,ContentType=WindowsRuntime]

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await-WinRT {
    param($Op, [Type]$ResultType, [int]$TimeoutMs = 1800)
    if ($null -eq $Op) { return $null }
    try {
        $task = $asTaskGeneric.MakeGenericMethod($ResultType).Invoke($null, @($Op))
        if ($task.Wait($TimeoutMs)) {
            return $task.Result
        }
    } catch {}
    return $null
}

function Escape-JsonStr {
    param([string]$s)
    if ($null -eq $s) { return "" }
    $sb = New-Object System.Text.StringBuilder
    foreach ($c in $s.ToCharArray()) {
        switch ([int]$c) {
            34 { [void]$sb.Append('\"') }
            92 { [void]$sb.Append('\\') }
            8  { [void]$sb.Append('\b') }
            12 { [void]$sb.Append('\f') }
            10 { [void]$sb.Append('\n') }
            13 { [void]$sb.Append('\r') }
            9  { [void]$sb.Append('\t') }
            default {
                if ([int]$c -lt 32) {
                    [void]$sb.AppendFormat('\u{0:x4}', [int]$c)
                } else {
                    [void]$sb.Append($c)
                }
            }
        }
    }
    return $sb.ToString()
}

function Read-ThumbnailBase64 {
    param($ThumbRef)
    if ($null -eq $ThumbRef) { return $null }
    $winrtStream = $null
    $dotnetStream = $null
    $memStream = $null
    try {
        $winrtStream = Await-WinRT -Op ($ThumbRef.OpenReadAsync()) -ResultType ([Windows.Storage.Streams.IRandomAccessStreamWithContentType]) -TimeoutMs 1800
        if ($null -eq $winrtStream) { return $null }
        $dotnetStream = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($winrtStream)
        $memStream = New-Object System.IO.MemoryStream
        $dotnetStream.CopyTo($memStream)
        $bytes = $memStream.ToArray()
        if ($bytes.Length -lt 64 -or $bytes.Length -gt 2097152) { return $null }
        $mime = "image/jpeg"
        try {
            if ($winrtStream.ContentType -and $winrtStream.ContentType.StartsWith("image/")) {
                $mime = $winrtStream.ContentType
            }
        } catch {}
        return @{ mime = $mime; b64 = [Convert]::ToBase64String($bytes) }
    } catch {
        return $null
    } finally {
        if ($memStream) { try { $memStream.Dispose() } catch {} }
        if ($dotnetStream) { try { $dotnetStream.Dispose() } catch {} }
        if ($winrtStream) { try { $winrtStream.Dispose() } catch {} }
    }
}

function Select-BestSession {
    param($Manager)
    if ($null -eq $Manager) { return $null }
    try {
        $current = $Manager.GetCurrentSession()
        if ($null -ne $current) {
            $pb = $current.GetPlaybackInfo()
            if ($pb -and $pb.PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing) {
                return $current
            }
        }
        $all = $Manager.GetSessions()
        if ($all -and $all.Count -gt 0) {
            foreach ($s in $all) {
                try {
                    $pb = $s.GetPlaybackInfo()
                    if ($pb -and $pb.PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing) {
                        return $s
                    }
                } catch {}
            }
        }
        if ($null -ne $current) { return $current }
        if ($all -and $all.Count -gt 0) { return $all[0] }
    } catch {}
    return $null
}

$manager = Await-WinRT -Op ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) -ResultType ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]) -TimeoutMs 2500

[Console]::Out.WriteLine('{"type":"media_ready"}')
[Console]::Out.Flush()

$lastTrackKey = ""
$lastStateSig = ""
$lastEmitTick = [Environment]::TickCount
$cachedThumb = $null

while ($true) {
    # 1. Process incoming transport commands immediately
    $cmdLine = ""
    while ([MediaBridgeHelper]::Commands.TryDequeue([ref]$cmdLine)) {
        $parts = $cmdLine.Split('|')
        if ($parts[0] -eq "CMD" -and $parts.Length -ge 2) {
            $action = $parts[1].ToLowerInvariant()
            $handled = $false
            if ($null -eq $manager) {
                $manager = Await-WinRT -Op ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) -ResultType ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]) -TimeoutMs 1500
            }
            $sess = Select-BestSession -Manager $manager
            if ($null -ne $sess) {
                try {
                    if ($action -eq "playpause") {
                        $handled = [bool](Await-WinRT -Op ($sess.TryTogglePlayPauseAsync()) -ResultType ([bool]) -TimeoutMs 1200)
                    } elseif ($action -eq "next") {
                        $handled = [bool](Await-WinRT -Op ($sess.TrySkipNextAsync()) -ResultType ([bool]) -TimeoutMs 1200)
                    } elseif ($action -eq "prev") {
                        $handled = [bool](Await-WinRT -Op ($sess.TrySkipPreviousAsync()) -ResultType ([bool]) -TimeoutMs 1200)
                    }
                } catch {}
            }
            if (-not $handled) {
                if ($action -eq "playpause") { [MediaBridgeHelper]::SendMediaKey([MediaBridgeHelper]::VK_MEDIA_PLAY_PAUSE) }
                elseif ($action -eq "next") { [MediaBridgeHelper]::SendMediaKey([MediaBridgeHelper]::VK_MEDIA_NEXT_TRACK) }
                elseif ($action -eq "prev") { [MediaBridgeHelper]::SendMediaKey([MediaBridgeHelper]::VK_MEDIA_PREV_TRACK) }
            }
            # Force immediate state refresh on this cycle
            $lastStateSig = ""
        } elseif ($parts[0] -eq "REFRESH") {
            $lastStateSig = ""
        }
    }

    # 2. Poll GSMTC with adaptive cadence (event-woken immediately on stdin transport commands)
    if ($null -eq $manager) {
        $manager = Await-WinRT -Op ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) -ResultType ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]) -TimeoutMs 1500
    }
    $sess = Select-BestSession -Manager $manager
    $isPlaying = $false

    if ($null -eq $sess) {
        $sig = "IDLE"
        if ($sig -ne $lastStateSig) {
            $lastStateSig = $sig
            $lastTrackKey = ""
            $cachedThumb = $null
            [Console]::Out.WriteLine('{"type":"media","active":false,"playing":false,"title":"","artist":"","album":"","sourceApp":"","position":0,"duration":0,"hasThumbnail":false}')
            [Console]::Out.Flush()
        }
    } else {
        try {
            $props = Await-WinRT -Op ($sess.TryGetMediaPropertiesAsync()) -ResultType ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties]) -TimeoutMs 1500
            $pb = $sess.GetPlaybackInfo()
            $tl = $sess.GetTimelineProperties()

            $title = if ($props -and $props.Title) { [string]$props.Title } else { "" }
            $artist = if ($props -and $props.Artist) { [string]$props.Artist } else { "" }
            $album = if ($props -and $props.AlbumTitle) { [string]$props.AlbumTitle } else { "" }
            $appId = if ($sess.SourceAppUserModelId) { [string]$sess.SourceAppUserModelId } else { "" }
            $statusVal = if ($pb) { [int]$pb.PlaybackStatus } else { 0 }
            $isPlaying = ($statusVal -eq 4) # Playing = 4, Paused = 5

            $durationSec = 0
            $positionSec = 0
            if ($tl) {
                $durationSec = [Math]::Max(0, [int][Math]::Round($tl.EndTime.TotalSeconds))
                $positionSec = [Math]::Max(0, [int][Math]::Round($tl.Position.TotalSeconds))
                if ($isPlaying -and $tl.LastUpdatedTime.Year -gt 2000) {
                    $elapsedSinceUpdate = ([DateTimeOffset]::UtcNow - $tl.LastUpdatedTime).TotalSeconds
                    if ($elapsedSinceUpdate -gt 0 -and $elapsedSinceUpdate -lt 7200) {
                        $positionSec = [int][Math]::Round($tl.Position.TotalSeconds + $elapsedSinceUpdate)
                    }
                }
                if ($durationSec -gt 0 -and $positionSec -gt $durationSec) {
                    $positionSec = $durationSec
                }
            }

            $trackKey = "$appId|$title|$artist|$album"
            $thumbChanged = $false
            if ($trackKey -ne $lastTrackKey) {
                $lastTrackKey = $trackKey
                $cachedThumb = if ($props -and $props.Thumbnail) { Read-ThumbnailBase64 -ThumbRef $props.Thumbnail } else { $null }
                $thumbChanged = $true
            }

            $sig = "$trackKey|$isPlaying|$statusVal"
            $nowTick = [Environment]::TickCount
            $needsPeriodicSync = $isPlaying -and (($nowTick - $lastEmitTick) -ge 4500)

            if ($sig -ne $lastStateSig -or $thumbChanged -or $needsPeriodicSync) {
                $lastStateSig = $sig
                $lastEmitTick = $nowTick
                $hasThumb = ($null -ne $cachedThumb)
                $thumbPayload = ""
                if ($thumbChanged -and $hasThumb) {
                    $thumbPayload = ',"thumbMime":"' + (Escape-JsonStr $cachedThumb.mime) + '","thumbB64":"' + $cachedThumb.b64 + '"'
                }
                $json = '{"type":"media","active":true,"playing":' + ($isPlaying.ToString().ToLowerInvariant()) +
                    ',"status":' + $statusVal +
                    ',"title":"' + (Escape-JsonStr $title) + '"' +
                    ',"artist":"' + (Escape-JsonStr $artist) + '"' +
                    ',"album":"' + (Escape-JsonStr $album) + '"' +
                    ',"sourceApp":"' + (Escape-JsonStr $appId) + '"' +
                    ',"position":' + $positionSec +
                    ',"duration":' + $durationSec +
                    ',"hasThumbnail":' + ($hasThumb.ToString().ToLowerInvariant()) +
                    $thumbPayload + '}'
                [Console]::Out.WriteLine($json)
                [Console]::Out.Flush()
            }
        } catch {}
    }

    $waitMs = if ($isPlaying) { 1500 } elseif ($null -ne $sess) { 2500 } else { 3500 }
    [void][MediaBridgeHelper]::WakeEvent.WaitOne($waitMs)
}
