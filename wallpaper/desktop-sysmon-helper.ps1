param(
  [int]$BridgePid = 0,
  [int]$IntervalMs = 3500
)

$ErrorActionPreference = 'SilentlyContinue'
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Native C# 5.0 helpers:
# 1. DioramaTempShm     — zero-elevation shared-memory CPU temp reader (HWiNFO64 / Afterburner / Core Temp)
# 2. DioramaSysmonControl — background stdin listener (PING / PIDS / STOP) + demand wake event
# 3. DioramaPdhMonitor  — persistent native pdh.dll handle for GPU Engine & GPU Memory (no Get-Counter churn)
$nativeCode = @"
using System;
using System.Collections.Generic;
using System.IO.MemoryMappedFiles;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public static class DioramaTempShm {
  public static double ReadCpuTempC() {
    double t;
    t = ReadHWiNFO();
    if (t >= 20.0 && t <= 115.0) return Math.Round(t, 1);
    t = ReadAfterburner();
    if (t >= 20.0 && t <= 115.0) return Math.Round(t, 1);
    t = ReadCoreTemp();
    if (t >= 20.0 && t <= 115.0) return Math.Round(t, 1);
    return -1.0;
  }

  private static string ReadCString(byte[] buf, int offset, int maxLen) {
    int end = offset;
    int limit = Math.Min(buf.Length, offset + maxLen);
    while (end < limit && buf[end] != 0) end++;
    return Encoding.ASCII.GetString(buf, offset, end - offset).Trim();
  }

  private static double ReadHWiNFO() {
    string[] names = new[] { "Global\\HWiNFO_SENS_SM2", "Local\\HWiNFO_SENS_SM2", "HWiNFO_SENS_SM2" };
    foreach (string mapName in names) {
      try {
        using (var mmf = MemoryMappedFile.OpenExisting(mapName, MemoryMappedFileRights.Read))
        using (var acc = mmf.CreateViewAccessor(0, 0, MemoryMappedFileAccess.Read)) {
          uint sig = acc.ReadUInt32(0);
          if (sig != 0x53695748 && sig != 0x48576953) continue; // 'HWiS'
          uint readingOffset = acc.ReadUInt32(32);
          uint readingSize = acc.ReadUInt32(36);
          uint readingCount = acc.ReadUInt32(40);
          if (readingSize < 292 || readingCount == 0 || readingCount > 4096) continue;
          byte[] row = new byte[readingSize];
          double fallbackCpu = -1.0;
          for (uint i = 0; i < readingCount; i++) {
            long pos = (long)readingOffset + (long)i * (long)readingSize;
            acc.ReadArray(pos, row, 0, (int)readingSize);
            uint readingType = BitConverter.ToUInt32(row, 0);
            if (readingType != 1) continue; // SENSOR_TYPE_TEMP = 1
            string labelOrig = ReadCString(row, 12, 128);
            string labelUser = ReadCString(row, 140, 128);
            double val = BitConverter.ToDouble(row, 284);
            if (val < 20.0 || val > 115.0) continue;
            string lbl = (labelOrig + " " + labelUser).ToLowerInvariant();
            if (lbl.Contains("cpu package") || lbl.Contains("tctl/tdie") || lbl.Contains("cpu (tctl") || lbl.Contains("core max") || lbl.Contains("cpu die")) {
              return val;
            }
            if (fallbackCpu < 0 && lbl.Contains("cpu") && !lbl.Contains("gpu") && !lbl.Contains("distance") && !lbl.Contains("limit")) {
              fallbackCpu = val;
            }
          }
          if (fallbackCpu > 0) return fallbackCpu;
        }
      } catch {}
    }
    return -1.0;
  }

  private static double ReadAfterburner() {
    try {
      using (var mmf = MemoryMappedFile.OpenExisting("MAHMSharedMemory", MemoryMappedFileRights.Read))
      using (var acc = mmf.CreateViewAccessor(0, 0, MemoryMappedFileAccess.Read)) {
        uint sig = acc.ReadUInt32(0);
        if (sig != 0x4D41484D && sig != 0x4D48414D) return -1.0;
        uint headerSize = acc.ReadUInt32(8);
        uint numEntries = acc.ReadUInt32(12);
        uint entrySize = acc.ReadUInt32(16);
        if (headerSize < 24 || entrySize < 1304 || numEntries == 0 || numEntries > 512) return -1.0;
        byte[] row = new byte[entrySize];
        for (uint i = 0; i < numEntries; i++) {
          long pos = (long)headerSize + (long)i * (long)entrySize;
          acc.ReadArray(pos, row, 0, (int)entrySize);
          string name = ReadCString(row, 0, 260).ToLowerInvariant();
          if (name == "cpu temperature" || (name.Contains("cpu") && name.Contains("temp"))) {
            float val = BitConverter.ToSingle(row, 1300);
            if (val >= 20.0f && val <= 115.0f) return (double)val;
          }
        }
      }
    } catch {}
    return -1.0;
  }

  private static double ReadCoreTemp() {
    try {
      using (var mmf = MemoryMappedFile.OpenExisting("CoreTempMappingObject", MemoryMappedFileRights.Read))
      using (var acc = mmf.CreateViewAccessor(0, 0, MemoryMappedFileAccess.Read)) {
        uint coreCnt = acc.ReadUInt32(256 * 4 + 128 * 4);
        if (coreCnt == 0 || coreCnt > 128) return -1.0;
        int tempOffset = 256 * 4 + 128 * 4 + 8;
        double maxT = -1.0;
        for (uint i = 0; i < coreCnt; i++) {
          float t = acc.ReadSingle(tempOffset + (int)i * 4);
          if (t >= 20.0f && t <= 115.0f && t > maxT) maxT = t;
        }
        return maxT;
      }
    } catch {}
    return -1.0;
  }
}

public static class DioramaSysmonControl {
  public static AutoResetEvent WakeEvent = new AutoResetEvent(false);
  private static long _lastDemandUtcTicks = DateTime.UtcNow.Ticks;
  private static readonly object _pidLock = new object();
  private static int[] _trackedPids = new int[0];

  public static void MarkDemand() {
    Interlocked.Exchange(ref _lastDemandUtcTicks, DateTime.UtcNow.Ticks);
    WakeEvent.Set();
  }

  public static double SecondsSinceLastDemand() {
    long ticks = Interlocked.Read(ref _lastDemandUtcTicks);
    return (DateTime.UtcNow - new DateTime(ticks, DateTimeKind.Utc)).TotalSeconds;
  }

  public static void UpdateTrackedPids(string csv) {
    List<int> list = new List<int>();
    if (!string.IsNullOrEmpty(csv)) {
      string[] parts = csv.Split(',');
      for (int i = 0; i < parts.Length; i++) {
        int val;
        if (int.TryParse(parts[i].Trim(), out val) && val > 0) {
          list.Add(val);
        }
      }
    }
    lock (_pidLock) {
      _trackedPids = list.ToArray();
    }
  }

  public static int[] GetTrackedPids() {
    lock (_pidLock) {
      return (int[])_trackedPids.Clone();
    }
  }

  public static void Start() {
    MarkDemand();
    Thread t = new Thread(new ThreadStart(ReadLoop));
    t.IsBackground = true;
    t.Start();
  }

  private static void ReadLoop() {
    try {
      string line;
      while ((line = Console.In.ReadLine()) != null) {
        string trimmed = line.Trim();
        if (trimmed.Length == 0) continue;
        if (trimmed == "PING") {
          MarkDemand();
        } else if (trimmed.StartsWith("PIDS|")) {
          UpdateTrackedPids(trimmed.Substring(5));
        } else if (trimmed == "STOP") {
          Environment.Exit(0);
        }
      }
      Environment.Exit(0);
    } catch {
      Environment.Exit(0);
    }
  }
}

public sealed class DioramaPdhResult {
  public bool Ok;
  public double PdhGpuPct;
  public double DioramaGpuPct;
  public double DioramaVramMb;
  public double TotalSystemDedVramMb;
  public int ActiveAdapterCount;
}

public static class DioramaPdhMonitor {
  private const uint PDH_FMT_DOUBLE = 0x00000200;
  private const uint PDH_MORE_DATA = 0x800007D2;

  [StructLayout(LayoutKind.Sequential)]
  private struct PDH_FMT_COUNTERVALUE {
    public uint CStatus;
    public double doubleValue;
  }

  [StructLayout(LayoutKind.Sequential)]
  private struct PDH_FMT_COUNTERVALUE_ITEM {
    public IntPtr szName;
    public PDH_FMT_COUNTERVALUE FmtValue;
  }

  [DllImport("pdh.dll", CharSet = CharSet.Unicode)]
  private static extern uint PdhOpenQuery(string szDataSource, IntPtr dwUserData, out IntPtr phQuery);

  [DllImport("pdh.dll", CharSet = CharSet.Unicode)]
  private static extern uint PdhAddEnglishCounterW(IntPtr hQuery, string szFullCounterPath, IntPtr dwUserData, out IntPtr phCounter);

  [DllImport("pdh.dll")]
  private static extern uint PdhCollectQueryData(IntPtr hQuery);

  [DllImport("pdh.dll", CharSet = CharSet.Unicode)]
  private static extern uint PdhGetFormattedCounterArrayW(IntPtr hCounter, uint dwFormat, ref uint lpdwBufferSize, ref uint lpdwItemCount, IntPtr ItemBuffer);

  [DllImport("pdh.dll")]
  private static extern uint PdhCloseQuery(IntPtr hQuery);

  private static IntPtr _query = IntPtr.Zero;
  private static IntPtr _gpuEngineCounter = IntPtr.Zero;
  private static IntPtr _gpuDedCounter = IntPtr.Zero;
  private static IntPtr _gpuSharedCounter = IntPtr.Zero;
  private static bool _initialized = false;

  public static bool Init() {
    if (_initialized) return true;
    try {
      if (PdhOpenQuery(null, IntPtr.Zero, out _query) != 0 || _query == IntPtr.Zero) return false;
      PdhAddEnglishCounterW(_query, "\\GPU Engine(*)\\Utilization Percentage", IntPtr.Zero, out _gpuEngineCounter);
      PdhAddEnglishCounterW(_query, "\\GPU Process Memory(*)\\Dedicated Usage", IntPtr.Zero, out _gpuDedCounter);
      PdhAddEnglishCounterW(_query, "\\GPU Process Memory(*)\\Shared Usage", IntPtr.Zero, out _gpuSharedCounter);
      if (_gpuEngineCounter == IntPtr.Zero && _gpuDedCounter == IntPtr.Zero && _gpuSharedCounter == IntPtr.Zero) {
        Close();
        return false;
      }
      // Prime rate counters
      PdhCollectQueryData(_query);
      _initialized = true;
      return true;
    } catch {
      Close();
      return false;
    }
  }

  public static void Close() {
    _initialized = false;
    _gpuEngineCounter = IntPtr.Zero;
    _gpuDedCounter = IntPtr.Zero;
    _gpuSharedCounter = IntPtr.Zero;
    if (_query != IntPtr.Zero) {
      try { PdhCloseQuery(_query); } catch {}
      _query = IntPtr.Zero;
    }
  }

  private static int ParsePidPrefix(string inst) {
    if (string.IsNullOrEmpty(inst) || !inst.StartsWith("pid_")) return -1;
    int sep = inst.IndexOf('_', 4);
    if (sep <= 4) return -1;
    int pid;
    return int.TryParse(inst.Substring(4, sep - 4), out pid) ? pid : -1;
  }

  private static bool TryParseLuidEng(string inst, out string adapterKey, out string luidKey) {
    adapterKey = null;
    luidKey = null;
    if (string.IsNullOrEmpty(inst)) return false;
    int luidIdx = inst.IndexOf("luid_");
    if (luidIdx < 0) return false;
    int physIdx = inst.IndexOf("_phys_", luidIdx);
    if (physIdx <= luidIdx + 5) return false;
    int engIdx = inst.LastIndexOf("_engtype_");
    if (engIdx < 0 || engIdx + 9 >= inst.Length) return false;
    luidKey = inst.Substring(luidIdx + 5, physIdx - (luidIdx + 5));
    // Include eng_<n>_engtype_<type> so multiple physical engines of the same type are reported per-engine like Task Manager
    adapterKey = inst.Substring(luidIdx + 5);
    return true;
  }

  private delegate void CounterItemVisitor(string name, double val);

  private static bool ForEachCounterItem(IntPtr counter, CounterItemVisitor visitor) {
    if (counter == IntPtr.Zero) return false;
    uint bufSize = 0;
    uint count = 0;
    uint status = PdhGetFormattedCounterArrayW(counter, PDH_FMT_DOUBLE, ref bufSize, ref count, IntPtr.Zero);
    for (int attempt = 0; attempt < 2 && status == PDH_MORE_DATA && bufSize > 0; attempt++) {
      IntPtr buf = Marshal.AllocHGlobal((int)bufSize);
      try {
        status = PdhGetFormattedCounterArrayW(counter, PDH_FMT_DOUBLE, ref bufSize, ref count, buf);
        if (status == 0) {
          int stride = Marshal.SizeOf(typeof(PDH_FMT_COUNTERVALUE_ITEM));
          for (uint i = 0; i < count; i++) {
            IntPtr itemPtr = new IntPtr(buf.ToInt64() + (long)i * stride);
            PDH_FMT_COUNTERVALUE_ITEM item = (PDH_FMT_COUNTERVALUE_ITEM)Marshal.PtrToStructure(itemPtr, typeof(PDH_FMT_COUNTERVALUE_ITEM));
            if (item.FmtValue.CStatus > 1) continue;
            string name = item.szName != IntPtr.Zero ? Marshal.PtrToStringUni(item.szName) : "";
            double val = item.FmtValue.doubleValue;
            if (!double.IsNaN(val) && !double.IsInfinity(val)) {
              visitor(name, val);
            }
          }
          return true;
        }
      } finally {
        Marshal.FreeHGlobal(buf);
      }
    }
    return false;
  }

  public static DioramaPdhResult Sample(int[] dioramaPidArray) {
    DioramaPdhResult res = new DioramaPdhResult();
    res.Ok = false;
    res.PdhGpuPct = -1.0;
    res.DioramaGpuPct = -1.0;
    res.DioramaVramMb = -1.0;
    res.TotalSystemDedVramMb = 0.0;
    res.ActiveAdapterCount = 0;

    if (!_initialized && !Init()) return res;
    if (PdhCollectQueryData(_query) != 0) return res;

    HashSet<int> dioPids = new HashSet<int>();
    if (dioramaPidArray != null) {
      for (int i = 0; i < dioramaPidArray.Length; i++) dioPids.Add(dioramaPidArray[i]);
    }

    if (_gpuEngineCounter != IntPtr.Zero) {
      Dictionary<string, double> sysTotals = new Dictionary<string, double>();
      Dictionary<string, double> dioTotals = new Dictionary<string, double>();
      Dictionary<string, double> luidLoads = new Dictionary<string, double>();

      bool engOk = ForEachCounterItem(_gpuEngineCounter, delegate(string inst, double val) {
        if (val <= 0.0) return;
        string adapterKey;
        string luidKey;
        if (!TryParseLuidEng(inst, out adapterKey, out luidKey)) return;

        double curSys;
        sysTotals.TryGetValue(adapterKey, out curSys);
        sysTotals[adapterKey] = curSys + val;

        double curLuid;
        luidLoads.TryGetValue(luidKey, out curLuid);
        if (val + curLuid > curLuid) luidLoads[luidKey] = curLuid + val;

        int pid = ParsePidPrefix(inst);
        if (pid > 0 && dioPids.Contains(pid)) {
          double curDio;
          dioTotals.TryGetValue(adapterKey, out curDio);
          dioTotals[adapterKey] = curDio + val;
        }
      });

      if (engOk) {
        double maxSys = 0.0;
        foreach (double v in sysTotals.Values) {
          if (v > maxSys) maxSys = v;
        }
        double maxDio = 0.0;
        foreach (double v in dioTotals.Values) {
          if (v > maxDio) maxDio = v;
        }
        int activeAdapters = 0;
        foreach (double lv in luidLoads.Values) {
          if (lv > 0.5) activeAdapters++;
        }
        res.PdhGpuPct = Math.Round(Math.Min(100.0, maxSys), 1);
        res.DioramaGpuPct = Math.Round(Math.Min(100.0, maxDio), 1);
        res.ActiveAdapterCount = activeAdapters;
        res.Ok = true;
      }
    }

    double dioDedBytes = 0.0;
    double dioSharedBytes = 0.0;
    double sysDedBytes = 0.0;
    bool memOk = false;

    if (_gpuDedCounter != IntPtr.Zero) {
      bool okDed = ForEachCounterItem(_gpuDedCounter, delegate(string inst, double val) {
        if (val <= 0.0) return;
        sysDedBytes += val;
        int pid = ParsePidPrefix(inst);
        if (pid > 0 && dioPids.Contains(pid)) dioDedBytes += val;
      });
      if (okDed) memOk = true;
    }

    if (_gpuSharedCounter != IntPtr.Zero) {
      bool okShared = ForEachCounterItem(_gpuSharedCounter, delegate(string inst, double val) {
        if (val <= 0.0) return;
        int pid = ParsePidPrefix(inst);
        if (pid > 0 && dioPids.Contains(pid)) dioSharedBytes += val;
      });
      if (okShared) memOk = true;
    }

    if (memOk) {
      res.TotalSystemDedVramMb = Math.Round(sysDedBytes / (1024.0 * 1024.0), 1);
      double dioBytes = dioDedBytes > 0.0 ? dioDedBytes : dioSharedBytes;
      if (dioBytes > 0.0) {
        res.DioramaVramMb = Math.Round(dioBytes / (1024.0 * 1024.0), 1);
      }
    }

    return res;
  }
}
"@

$nativeReady = $false
try {
  Add-Type -TypeDefinition $nativeCode -Language CSharp -ErrorAction Stop
  [DioramaSysmonControl]::Start()
  [void][DioramaPdhMonitor]::Init()
  $nativeReady = $true
} catch {}

$logicalCores = [Math]::Max(1, [Environment]::ProcessorCount)
$prevCpuMap = @{}
$lastSampleAt = [DateTime]::UtcNow
$cachedGpuName = ''
$cachedIgpuName = ''
$cachedCpuName = ''

try {
  $cpuInfo = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
  if ($cpuInfo -and $cpuInfo.Name) {
    $cachedCpuName = ($cpuInfo.Name -replace '\s+', ' ').Trim()
  }
} catch {}

try {
  $gpus = @(Get-CimInstance -ClassName Win32_VideoController)
  if ($gpus.Count -gt 0) {
    $dgpu = $gpus | Where-Object { $_.Name -match 'NVIDIA|RTX|GTX' } | Select-Object -First 1
    $igpu = $gpus | Where-Object { $_.Name -match 'Intel|AMD Radeon\(TM\) Graphics|Radeon Graphics|Arc' -and $_.Name -notmatch 'NVIDIA' } | Select-Object -First 1
    if ($dgpu -and $dgpu.Name) { $cachedGpuName = ($dgpu.Name).Trim() }
    elseif ($gpus[0].Name) { $cachedGpuName = ($gpus[0].Name).Trim() }
    if ($igpu -and $igpu.Name) { $cachedIgpuName = ($igpu.Name).Trim() }
  }
} catch {}

$hasHybridGpu = [bool]($cachedIgpuName -and $cachedGpuName -and ($cachedGpuName -match 'NVIDIA|RTX|GTX'))

# One-shot WMI temperature provider cache: avoid hammering 4 WMI namespaces every cycle!
$script:tempWmiProvider = $null
$script:tempWmiNextProbeUtc = [DateTime]::MinValue

function Query-LhmTemp {
  param([string]$Ns)
  try {
    $sensors = @(Get-CimInstance -Namespace $Ns -ClassName Sensor -ErrorAction Stop |
      Where-Object { $_.SensorType -eq 'Temperature' -and $_.Value -gt 20 -and $_.Value -lt 115 })
    if ($sensors.Count -gt 0) {
      $pkg = $sensors | Where-Object { $_.Name -match 'CPU Package|Tctl|Tdie|Core Max|Core Average|CPU' } | Select-Object -First 1
      if ($pkg) { return [Math]::Round([double]$pkg.Value, 1) }
    }
  } catch {}
  return $null
}

function Query-PerfTzTemp {
  try {
    $tzPerf = @(Get-CimInstance -ClassName Win32_PerfFormattedData_Counters_ThermalZoneInformation -ErrorAction Stop)
    $best = $null
    foreach ($z in $tzPerf) {
      $raw = [double]$z.Temperature
      $c = if ($raw -gt 200) { $raw - 273.15 } else { $raw }
      if ($c -ge 34.0 -and $c -le 110.0) {
        if ($null -eq $best -or $c -gt $best) { $best = $c }
      }
    }
    if ($null -ne $best) { return [Math]::Round($best, 1) }
  } catch {}
  return $null
}

function Query-AcpiTzTemp {
  try {
    $acpi = @(Get-CimInstance -Namespace 'root/WMI' -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction Stop)
    $best = $null
    foreach ($z in $acpi) {
      $c = ([double]$z.CurrentTemperature / 10.0) - 273.15
      if ($c -ge 34.0 -and $c -le 110.0) {
        if ($null -eq $best -or $c -gt $best) { $best = $c }
      }
    }
    if ($null -ne $best) { return [Math]::Round($best, 1) }
  } catch {}
  return $null
}

function Get-CpuTemperatureC {
  # 1. HWiNFO64 / MSI Afterburner / Core Temp shared memory (pure memory read, <0.05ms)
  if ($nativeReady) {
    try {
      $t = [DioramaTempShm]::ReadCpuTempC()
      if ($t -ge 20.0 -and $t -le 115.0) { return [Math]::Round([double]$t, 1) }
    } catch {}
  }

  # 2. Cached WMI provider (probed once at startup, or re-probed at most every 120s when none)
  $utcNow = [DateTime]::UtcNow
  if ($script:tempWmiProvider -eq 'lhm') {
    $v = Query-LhmTemp -Ns 'root/LibreHardwareMonitor'
    if ($null -ne $v) { return $v }
    $script:tempWmiProvider = 'none'
    $script:tempWmiNextProbeUtc = $utcNow.AddSeconds(120)
    return $null
  }
  if ($script:tempWmiProvider -eq 'ohm') {
    $v = Query-LhmTemp -Ns 'root/OpenHardwareMonitor'
    if ($null -ne $v) { return $v }
    $script:tempWmiProvider = 'none'
    $script:tempWmiNextProbeUtc = $utcNow.AddSeconds(120)
    return $null
  }
  if ($script:tempWmiProvider -eq 'tz') {
    $v = Query-PerfTzTemp
    if ($null -ne $v) { return $v }
    $script:tempWmiProvider = 'none'
    $script:tempWmiNextProbeUtc = $utcNow.AddSeconds(120)
    return $null
  }
  if ($script:tempWmiProvider -eq 'acpi') {
    $v = Query-AcpiTzTemp
    if ($null -ne $v) { return $v }
    $script:tempWmiProvider = 'none'
    $script:tempWmiNextProbeUtc = $utcNow.AddSeconds(120)
    return $null
  }

  if ($null -ne $script:tempWmiProvider -and $utcNow -lt $script:tempWmiNextProbeUtc) {
    return $null
  }

  # One-shot discovery across providers
  $v = Query-LhmTemp -Ns 'root/LibreHardwareMonitor'
  if ($null -ne $v) { $script:tempWmiProvider = 'lhm'; return $v }
  $v = Query-LhmTemp -Ns 'root/OpenHardwareMonitor'
  if ($null -ne $v) { $script:tempWmiProvider = 'ohm'; return $v }
  $v = Query-PerfTzTemp
  if ($null -ne $v) { $script:tempWmiProvider = 'tz'; return $v }
  $v = Query-AcpiTzTemp
  if ($null -ne $v) { $script:tempWmiProvider = 'acpi'; return $v }

  $script:tempWmiProvider = 'none'
  $script:tempWmiNextProbeUtc = $utcNow.AddSeconds(120)
  return $null
}

[Console]::Out.WriteLine('SYSMON_READY')
[Console]::Out.Flush()

$sleepMs = [Math]::Max(2000, $IntervalMs)

while ($true) {
  # Idle sleep mode: if bridge hasn't sent PING in >16s (monitor hidden/paused), skip all PDH/WMI/Process polling!
  if ($nativeReady -and ([DioramaSysmonControl]::SecondsSinceLastDemand() -gt 16.0)) {
    [void][DioramaSysmonControl]::WakeEvent.WaitOne(2000)
    $lastSampleAt = [DateTime]::UtcNow
    continue
  }

  $now = [DateTime]::UtcNow
  $elapsedSec = [Math]::Max(0.5, ($now - $lastSampleAt).TotalSeconds)
  $lastSampleAt = $now

  # 1. Collect ALL Wallpaper Engine renderer & compositor processes + pushed bridge/helper PIDs (zero WMI query!)
  $wallpaperProcs = @(Get-Process -Name 'webwallpaper32', 'webwallpaper64', 'wallpaper32', 'wallpaper64' -ErrorAction SilentlyContinue)

  $bridgePids = [System.Collections.Generic.HashSet[int]]::new()
  if ($BridgePid -gt 0) { [void]$bridgePids.Add($BridgePid) }
  [void]$bridgePids.Add($PID)
  if ($nativeReady) {
    foreach ($tp in [DioramaSysmonControl]::GetTrackedPids()) {
      if ($tp -gt 0) { [void]$bridgePids.Add([int]$tp) }
    }
  }

  $bridgeProcs = @()
  foreach ($bp in $bridgePids) {
    $p = Get-Process -Id $bp -ErrorAction SilentlyContinue
    if ($p) { $bridgeProcs += $p }
  }

  $wallpaperRamBytes = 0L
  $bridgeRamBytes = 0L
  $dioramaPids = [System.Collections.Generic.HashSet[int]]::new()
  $dioramaCpuSecDelta = 0.0
  $nextCpuMap = @{}

  foreach ($p in $wallpaperProcs) {
    if ($dioramaPids.Add([int]$p.Id)) {
      try { $wallpaperRamBytes += [long]$p.WorkingSet64 } catch {}
      try {
        $cpuSec = [double]$p.TotalProcessorTime.TotalSeconds
        $nextCpuMap[$p.Id] = $cpuSec
        if ($prevCpuMap.ContainsKey($p.Id)) {
          $d = $cpuSec - [double]$prevCpuMap[$p.Id]
          if ($d -gt 0) { $dioramaCpuSecDelta += $d }
        }
      } catch {}
    }
  }

  foreach ($p in $bridgeProcs) {
    if ($dioramaPids.Add([int]$p.Id)) {
      try { $bridgeRamBytes += [long]$p.WorkingSet64 } catch {}
      try {
        $cpuSec = [double]$p.TotalProcessorTime.TotalSeconds
        $nextCpuMap[$p.Id] = $cpuSec
        if ($prevCpuMap.ContainsKey($p.Id)) {
          $d = $cpuSec - [double]$prevCpuMap[$p.Id]
          if ($d -gt 0) { $dioramaCpuSecDelta += $d }
        }
      } catch {}
    }
  }
  $prevCpuMap = $nextCpuMap

  $dioramaCpuPct = [Math]::Round([Math]::Min(100.0, ($dioramaCpuSecDelta / ($elapsedSec * $logicalCores)) * 100.0), 1)
  $wallpaperRamMb = [Math]::Round($wallpaperRamBytes / 1MB, 1)
  $bridgeRamMb = [Math]::Round($bridgeRamBytes / 1MB, 1)
  $dioramaRamMb = [Math]::Round(($wallpaperRamBytes + $bridgeRamBytes) / 1MB, 1)

  # 2. Persistent Native PDH GPU Engine & Memory sampling (zero process/PowerShell Get-Counter churn!)
  $pdhGpuPct = $null
  $dioramaGpuPct = $null
  $dioramaVramMb = $null
  $totalSystemDedVramMb = 0.0
  $activeAdapterCount = 0
  $dgpuLikelyActive = (-not $hasHybridGpu)

  if ($nativeReady) {
    try {
      [int[]]$pidArr = @($dioramaPids)
      $pdh = [DioramaPdhMonitor]::Sample($pidArr)
      if ($pdh) {
        if ($pdh.PdhGpuPct -ge 0) { $pdhGpuPct = [double]$pdh.PdhGpuPct }
        if ($pdh.DioramaGpuPct -ge 0) { $dioramaGpuPct = [double]$pdh.DioramaGpuPct }
        if ($pdh.DioramaVramMb -ge 0) { $dioramaVramMb = [double]$pdh.DioramaVramMb }
        $totalSystemDedVramMb = [double]$pdh.TotalSystemDedVramMb
        $activeAdapterCount = [int]$pdh.ActiveAdapterCount
        if ($hasHybridGpu) {
          $dgpuLikelyActive = ($totalSystemDedVramMb -gt 180.0 -or $activeAdapterCount -ge 2)
        }
      }
    } catch {}
  }

  # 3. Real CPU Temperature (SHM or one-shot cached WMI)
  $cpuTempC = Get-CpuTemperatureC

  $payload = [ordered]@{
    cpuName = $cachedCpuName
    gpuNameFallback = $cachedGpuName
    igpuName = $cachedIgpuName
    cpuTempC = $cpuTempC
    pdhGpuPct = $pdhGpuPct
    dioramaRamMb = $dioramaRamMb
    wallpaperRamMb = $wallpaperRamMb
    bridgeRamMb = $bridgeRamMb
    dioramaCpuPct = $dioramaCpuPct
    dioramaGpuPct = $dioramaGpuPct
    dioramaVramMb = $dioramaVramMb
    totalSystemDedVramMb = $totalSystemDedVramMb
    activeAdapterCount = $activeAdapterCount
    dgpuLikelyActive = $dgpuLikelyActive
    wallpaperRunning = ($wallpaperProcs.Count -gt 0)
    updatedAt = [DateTime]::UtcNow.ToString('o')
  }

  $json = $payload | ConvertTo-Json -Compress
  [Console]::Out.WriteLine("SYSMON|$json")
  [Console]::Out.Flush()

  if ($nativeReady) {
    [void][DioramaSysmonControl]::WakeEvent.WaitOne($sleepMs)
  } else {
    Start-Sleep -Milliseconds $sleepMs
  }
}
