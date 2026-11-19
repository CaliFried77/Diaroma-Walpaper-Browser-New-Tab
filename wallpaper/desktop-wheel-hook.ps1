$ErrorActionPreference = "SilentlyContinue"
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$code = @'
using System;
using System.IO;
using System.Text;
using System.Drawing;
using System.Drawing.Imaging;
using System.Threading;
using System.Diagnostics;
using System.Windows.Forms;
using System.Runtime.InteropServices;

public class DesktopBridgeNativeHelper {
    private const int WH_KEYBOARD_LL = 13;
    private const int WH_MOUSE_LL = 14;
    private const int WM_KEYDOWN = 0x0100;
    private const int WM_SYSKEYDOWN = 0x0104;
    private const int WM_LBUTTONDOWN = 0x0201;
    private const int WM_RBUTTONDOWN = 0x0204;
    private const int WM_MOUSEWHEEL = 0x020A;
    private const int WM_MOUSEHWHEEL = 0x020E;
    private const uint SHGFI_ICON = 0x000000100;
    private const uint SHGFI_LARGEICON = 0x000000000;

    private static readonly object _outLock = new object();
    private static LowLevelMouseProc _mouseProc = MouseHookCallback;
    private static LowLevelKeyboardProc _kbProc = KeyboardHookCallback;
    private static IntPtr _mouseHookID = IntPtr.Zero;
    private static IntPtr _kbHookID = IntPtr.Zero;

    private static volatile bool _imeFocused = false;
    private static volatile bool _desktopActive = true;

    [StructLayout(LayoutKind.Sequential)]
    public struct POINT {
        public int x;
        public int y;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct MSLLHOOKSTRUCT {
        public POINT pt;
        public uint mouseData;
        public uint flags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct KBDLLHOOKSTRUCT {
        public uint vkCode;
        public uint scanCode;
        public uint flags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Auto)]
    public struct SHFILEINFO {
        public IntPtr hIcon;
        public int iIcon;
        public uint dwAttributes;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
        public string szDisplayName;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 80)]
        public string szTypeName;
    }

    public delegate IntPtr LowLevelMouseProc(int nCode, IntPtr wParam, IntPtr lParam);
    public delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelMouseProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);

    [DllImport("user32.dll")]
    private static extern IntPtr WindowFromPoint(POINT Point);

    [DllImport("user32.dll", ExactSpelling = true, CharSet = CharSet.Auto)]
    private static extern IntPtr GetParent(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    private static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    private static extern short GetAsyncKeyState(int vKey);

    [DllImport("user32.dll")]
    private static extern short GetKeyState(int nVirtKey);

    [DllImport("user32.dll")]
    private static extern IntPtr GetKeyboardLayout(uint idThread);

    [DllImport("user32.dll")]
    private static extern int ToUnicodeEx(
        uint wVirtKey,
        uint wScanCode,
        byte[] lpKeyState,
        [Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pwszBuff,
        int cchBuff,
        uint wFlags,
        IntPtr dwhkl
    );

    [DllImport("shell32.dll", CharSet = CharSet.Auto)]
    private static extern IntPtr SHGetFileInfo(string pszPath, uint dwFileAttributes, ref SHFILEINFO psfi, uint cbFileInfo, uint uFlags);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool DestroyIcon(IntPtr hIcon);

    private static void WriteJsonLine(string json) {
        lock (_outLock) {
            Console.WriteLine(json);
            Console.Out.Flush();
        }
    }

    private static string EscapeJsonString(string s) {
        if (string.IsNullOrEmpty(s)) return "";
        StringBuilder sb = new StringBuilder(s.Length + 4);
        foreach (char c in s) {
            if (c == '\\') sb.Append("\\\\");
            else if (c == '\"') sb.Append("\\\"");
            else if (c == '\n') sb.Append("\\n");
            else if (c == '\r') sb.Append("\\r");
            else if (c == '\t') sb.Append("\\t");
            else if (c >= 32) sb.Append(c);
        }
        return sb.ToString();
    }

    private static bool IsDesktopLayer(POINT pt) {
        IntPtr hwnd = WindowFromPoint(pt);
        int depth = 0;
        StringBuilder sb = new StringBuilder(64);
        while (hwnd != IntPtr.Zero && depth < 8) {
            sb.Clear();
            GetClassName(hwnd, sb, sb.Capacity);
            string cls = sb.ToString();
            if (cls == "SysListView32" || cls == "SHELLDLL_DefView" || cls == "WorkerW" || cls == "Progman" || cls == "CEF-OSC-WIDGET") {
                return true;
            }
            hwnd = GetParent(hwnd);
            depth++;
        }
        return false;
    }

    private static IntPtr MouseHookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
        if (nCode >= 0) {
            int msg = wParam.ToInt32();
            if (msg == WM_LBUTTONDOWN || msg == WM_RBUTTONDOWN) {
                try {
                    MSLLHOOKSTRUCT hookStruct = (MSLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(MSLLHOOKSTRUCT));
                    bool onDesktop = IsDesktopLayer(hookStruct.pt);
                    _desktopActive = onDesktop;
                    if (!onDesktop && _imeFocused) {
                        _imeFocused = false;
                        WriteJsonLine("{\"type\":\"blur\"}");
                    }
                } catch {}
            } else if (msg == WM_MOUSEWHEEL || msg == WM_MOUSEHWHEEL) {
                try {
                    MSLLHOOKSTRUCT hookStruct = (MSLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(MSLLHOOKSTRUCT));
                    if (IsDesktopLayer(hookStruct.pt)) {
                        short wheelDelta = (short)((hookStruct.mouseData >> 16) & 0xFFFF);
                        string axis = (msg == WM_MOUSEHWHEEL) ? "x" : "y";
                        WriteJsonLine("{\"type\":\"wheel\",\"axis\":\"" + axis + "\",\"delta\":" + wheelDelta + ",\"x\":" + hookStruct.pt.x + ",\"y\":" + hookStruct.pt.y + "}");
                    }
                } catch {}
            }
        }
        return CallNextHookEx(_mouseHookID, nCode, wParam, lParam);
    }

    private static IntPtr KeyboardHookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
        if (nCode >= 0 && _imeFocused && _desktopActive) {
            int msg = wParam.ToInt32();
            if (msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN) {
                try {
                    KBDLLHOOKSTRUCT kb = (KBDLLHOOKSTRUCT)Marshal.PtrToStructure(lParam, typeof(KBDLLHOOKSTRUCT));
                    uint vk = kb.vkCode;

                    // Ignore modifier keys themselves
                    if (vk == 0x10 || vk == 0x11 || vk == 0x12 || vk == 0xA0 || vk == 0xA1 || vk == 0xA2 || vk == 0xA3 || vk == 0xA4 || vk == 0xA5 || vk == 0x5B || vk == 0x5C) {
                        return CallNextHookEx(_kbHookID, nCode, wParam, lParam);
                    }

                    bool ctrl = (GetAsyncKeyState(0x11) & 0x8000) != 0;
                    bool alt = (GetAsyncKeyState(0x12) & 0x8000) != 0;
                    bool shift = (GetAsyncKeyState(0x10) & 0x8000) != 0;
                    bool altGr = ctrl && alt;

                    if (ctrl && !alt) {
                        if (vk == 0x56) { // Ctrl+V
                            WriteJsonLine("{\"type\":\"key\",\"key\":\"Paste\",\"text\":\"\"}");
                            return (IntPtr)1;
                        }
                        if (vk == 0x41) { // Ctrl+A
                            WriteJsonLine("{\"type\":\"key\",\"key\":\"SelectAll\",\"text\":\"\"}");
                            return (IntPtr)1;
                        }
                        return CallNextHookEx(_kbHookID, nCode, wParam, lParam);
                    }

                    if (alt && !ctrl) {
                        return CallNextHookEx(_kbHookID, nCode, wParam, lParam);
                    }

                    if (vk == 0x08) { WriteJsonLine("{\"type\":\"key\",\"key\":\"Backspace\",\"text\":\"\"}"); return (IntPtr)1; }
                    if (vk == 0x2E) { WriteJsonLine("{\"type\":\"key\",\"key\":\"Delete\",\"text\":\"\"}"); return (IntPtr)1; }
                    if (vk == 0x0D) { WriteJsonLine("{\"type\":\"key\",\"key\":\"Enter\",\"text\":\"\"}"); return (IntPtr)1; }
                    if (vk == 0x1B) {
                        _imeFocused = false;
                        WriteJsonLine("{\"type\":\"key\",\"key\":\"Escape\",\"text\":\"\"}");
                        return (IntPtr)1;
                    }
                    if (vk == 0x26) { WriteJsonLine("{\"type\":\"key\",\"key\":\"ArrowUp\",\"text\":\"\"}"); return (IntPtr)1; }
                    if (vk == 0x28) { WriteJsonLine("{\"type\":\"key\",\"key\":\"ArrowDown\",\"text\":\"\"}"); return (IntPtr)1; }
                    if (vk == 0x25) { WriteJsonLine("{\"type\":\"key\",\"key\":\"ArrowLeft\",\"text\":\"\"}"); return (IntPtr)1; }
                    if (vk == 0x27) { WriteJsonLine("{\"type\":\"key\",\"key\":\"ArrowRight\",\"text\":\"\"}"); return (IntPtr)1; }
                    if (vk == 0x20) { WriteJsonLine("{\"type\":\"key\",\"key\":\"Char\",\"text\":\" \"}"); return (IntPtr)1; }

                    byte[] keyState = new byte[256];
                    if (shift) keyState[0x10] = 0x80;
                    if ((GetKeyState(0x14) & 0x0001) != 0) keyState[0x14] = 0x01; // Caps Lock
                    if (altGr) {
                        keyState[0x11] = 0x80;
                        keyState[0x12] = 0x80;
                    }

                    StringBuilder sb = new StringBuilder(8);
                    IntPtr layout = GetKeyboardLayout(0);
                    int rc = ToUnicodeEx(vk, kb.scanCode, keyState, sb, sb.Capacity, 0, layout);
                    if (rc > 0) {
                        string ch = EscapeJsonString(sb.ToString(0, rc));
                        if (!string.IsNullOrEmpty(ch)) {
                            WriteJsonLine("{\"type\":\"key\",\"key\":\"Char\",\"text\":\"" + ch + "\"}");
                            return (IntPtr)1;
                        }
                    }
                } catch {}
            }
        }
        return CallNextHookEx(_kbHookID, nCode, wParam, lParam);
    }

    public static string ExtractPngBase64(string path) {
        if (string.IsNullOrEmpty(path)) return "";
        try {
            if (File.Exists(path)) {
                using (Icon ic = Icon.ExtractAssociatedIcon(path)) {
                    if (ic != null) {
                        using (Bitmap bmp = ic.ToBitmap())
                        using (MemoryStream ms = new MemoryStream()) {
                            bmp.Save(ms, ImageFormat.Png);
                            return Convert.ToBase64String(ms.ToArray());
                        }
                    }
                }
            }
        } catch {}

        try {
            SHFILEINFO shinfo = new SHFILEINFO();
            IntPtr res = SHGetFileInfo(path, 0, ref shinfo, (uint)Marshal.SizeOf(shinfo), SHGFI_ICON | SHGFI_LARGEICON);
            if (res != IntPtr.Zero && shinfo.hIcon != IntPtr.Zero) {
                try {
                    using (Icon ic = Icon.FromHandle(shinfo.hIcon))
                    using (Bitmap bmp = ic.ToBitmap())
                    using (MemoryStream ms = new MemoryStream()) {
                        bmp.Save(ms, ImageFormat.Png);
                        return Convert.ToBase64String(ms.ToArray());
                    }
                } finally {
                    DestroyIcon(shinfo.hIcon);
                }
            }
        } catch {}
        return "";
    }

    private static void StdinWorker() {
        try {
            string line;
            while ((line = Console.In.ReadLine()) != null) {
                if (line == "IME|1") {
                    _imeFocused = true;
                    _desktopActive = true;
                    continue;
                }
                if (line == "IME|0") {
                    _imeFocused = false;
                    continue;
                }
                if (!line.StartsWith("ICON|")) continue;
                int firstBar = line.IndexOf('|');
                int secondBar = line.IndexOf('|', firstBar + 1);
                if (secondBar < 0) continue;
                string reqId = line.Substring(firstBar + 1, secondBar - firstBar - 1);
                string filePath = line.Substring(secondBar + 1);
                string b64 = ExtractPngBase64(filePath);
                WriteJsonLine("{\"type\":\"icon\",\"id\":\"" + reqId + "\",\"png\":\"" + b64 + "\"}");
            }
        } catch {}
    }

    public static void Run() {
        Thread worker = new Thread(StdinWorker);
        worker.IsBackground = true;
        worker.Start();

        using (Process curProcess = Process.GetCurrentProcess())
        using (ProcessModule curModule = curProcess.MainModule) {
            IntPtr hMod = GetModuleHandle(curModule.ModuleName);
            _mouseHookID = SetWindowsHookEx(WH_MOUSE_LL, _mouseProc, hMod, 0);
            _kbHookID = SetWindowsHookEx(WH_KEYBOARD_LL, _kbProc, hMod, 0);
        }
        WriteJsonLine("{\"type\":\"ready\"}");
        Application.Run();
        UnhookWindowsHookEx(_mouseHookID);
        UnhookWindowsHookEx(_kbHookID);
    }
}
'@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Windows.Forms, System.Drawing
[DesktopBridgeNativeHelper]::Run()
