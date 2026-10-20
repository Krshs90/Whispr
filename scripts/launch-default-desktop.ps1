param(
    [string]$ExePath,
    [string]$WorkDir
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class WinStaDefaultLauncher {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct STARTUPINFO {
        public Int32 cb;
        public string lpReserved;
        public string lpDesktop;
        public string lpTitle;
        public Int32 dwX;
        public Int32 dwY;
        public Int32 dwXSize;
        public Int32 dwYSize;
        public Int32 dwXCountChars;
        public Int32 dwYCountChars;
        public Int32 dwFillAttribute;
        public Int32 dwFlags;
        public Int16 wShowWindow;
        public Int16 cbReserved2;
        public IntPtr lpReserved2;
        public IntPtr hStdInput;
        public IntPtr hStdOutput;
        public IntPtr hStdError;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct PROCESS_INFORMATION {
        public IntPtr hProcess;
        public IntPtr hThread;
        public int dwProcessId;
        public int dwThreadId;
    }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CreateProcessW(
        string lpApplicationName,
        string lpCommandLine,
        IntPtr lpProcessAttributes,
        IntPtr lpThreadAttributes,
        bool bInheritHandles,
        uint dwCreationFlags,
        IntPtr lpEnvironment,
        string lpCurrentDirectory,
        ref STARTUPINFO lpStartupInfo,
        out PROCESS_INFORMATION lpProcessInformation
    );

    [DllImport("kernel32.dll")]
    public static extern IntPtr GetStdHandle(int nStdHandle);

    [DllImport("kernel32.dll")]
    public static extern uint WaitForSingleObject(IntPtr hHandle, uint dwMilliseconds);

    [DllImport("kernel32.dll")]
    public static extern bool GetExitCodeProcess(IntPtr hProcess, out uint lpExitCode);

    public static int Run(string cmdLine, string cwd) {
        STARTUPINFO si = new STARTUPINFO();
        si.cb = Marshal.SizeOf(si);
        si.lpDesktop = "WinSta0\\Default";
        si.dwFlags = 0x00000100; // STARTF_USESTDHANDLES
        si.hStdInput = GetStdHandle(-10);
        si.hStdOutput = GetStdHandle(-11);
        si.hStdError = GetStdHandle(-12);

        PROCESS_INFORMATION pi;
        bool ok = CreateProcessW(null, cmdLine, IntPtr.Zero, IntPtr.Zero, true, 0, IntPtr.Zero, cwd, ref si, out pi);
        if (!ok) {
            return -Marshal.GetLastWin32Error();
        }
        WaitForSingleObject(pi.hProcess, 0xFFFFFFFF);
        uint exitCode = 0;
        GetExitCodeProcess(pi.hProcess, out exitCode);
        return (int)exitCode;
    }
}
"@

$cmd = "`"$ExePath`" ."
$code = [WinStaDefaultLauncher]::Run($cmd, $WorkDir)
exit $code
