import { SimulatedScenario } from '../types';

export const SAMPLE_SCENARIOS: SimulatedScenario[] = [
  {
    id: 'kb5039302',
    title: 'Windows 11 KB5039302 causes infinite reboot loops on systems with nested virtualization',
    kbNumber: 'KB5039302',
    windowsVersion: 'Windows 11 23H2 / 22H2',
    category: 'Known Issue / Bug',
    source: 'bleeping_computer',
    date: '2025-01-14',
    link: 'https://www.bleepingcomputer.com/news/microsoft/microsoft-pulls-windows-11-kb5039302-update-due-to-reboot-loops/',
    summaryNote: 'Критический сбой: циклическая перезагрузка ПК при включенном Hyper-V, WSL, VMware или CloudPC/DevBox.',
    rawHtml: `Microsoft has temporarily halted the rollout of the Windows 11 KB5039302 optional preview update after receiving reports that it causes some PCs to get stuck in infinite reboot loops.

Details:
The issue primarily affects devices utilizing nested virtualization technologies, such as Hyper-V, Windows Subsystem for Linux (WSL), VMware, VirtualBox, or Cloud PC / Azure Virtual Desktop instances.

Symptoms:
- Boot loop on splash screen (spinning dots freeze, then reboot).
- Error 0xc0000001 or 0xc000021a during post-installation boot phase.

Workarounds:
1. Enter Windows Recovery Environment (WinRE) by interrupting boot 3 times.
2. Select Troubleshoot -> Advanced Options -> Uninstall Updates -> Uninstall latest quality update.
3. Via Command Prompt in WinRE: "dism /image:C:\\ /cleanup-image /revertpendingactions".
4. Disable Hyper-V in BIOS/UEFI temporarily if uninstallation fails.`
  },
  {
    id: 'kb5044284-24h2',
    title: 'Windows 11 24H2 KB5044284: Critical security fixes and game anti-cheat crashes',
    kbNumber: 'KB5044284',
    windowsVersion: 'Windows 11 24H2',
    category: 'Cumulative Update',
    source: 'ms_release_health',
    date: '2025-02-11',
    link: 'https://support.microsoft.com/help/5044284',
    summaryNote: 'Крупное накопительное обновление для 24H2. Исправляет утечки памяти DWM, но конфликтует со старыми драйверами Easy Anti-Cheat.',
    rawHtml: `Microsoft released KB5044284 for Windows 11 Version 24H2 (OS Build 26100.2033).
Highlights:
- Addresses security issues for your Windows operating system.
- Fixes Desktop Window Manager (dwm.exe) memory leak when playing DirectX 12 games.
- Resolves issue with OpenSSH server service failing to start.

Known Issues:
- Devices running games with older versions of Easy Anti-Cheat may experience BSOD (Bugcheck 0x139 KERNEL_SECURITY_CHECK_FAILURE) or system freezes.
- Fingerprint sensor might become unresponsive after locking the device.
- SFC /scannow repeatedly reports corrupted hash files in Bluetooth components even after repairs.

Workaround & Resolution:
- For Easy Anti-Cheat BSOD: Update games to their latest patches or update the anti-cheat driver from Epic Games.
- For SFC /scannow false positive: Microsoft confirmed this is a harmless reporting bug that will be addressed in a preview update; no action required.
- To rollback if system fails to boot: Run in Recovery CMD: "wusa /uninstall /kb:5044284 /quiet /norestart".`
  },
  {
    id: 'insider-canary-27758',
    title: 'Windows 11 Insider Preview Build 27758 (Canary Channel) with redesigned taskbar and Wi-Fi 7',
    kbNumber: 'Build 27758',
    windowsVersion: 'Windows 11 Canary (25H2)',
    category: 'Insider Build',
    source: 'windows_insider',
    date: '2025-03-01',
    link: 'https://blogs.windows.com/windows-insider/2025/03/announcing-windows-11-insider-preview-build-27758/',
    summaryNote: 'Свежая инсайдерская сборка 2025 года: новый адаптивный Taskbar, поддержка Wi-Fi 7 MLO и горячие клавиши проводника.',
    rawHtml: `Hello Windows Insiders, today we are releasing Windows 11 Insider Preview Build 27758 to the Canary Channel.

What is New in Build 27758:
- Taskbar & System Tray: Improved battery icon with high-precision charging indicators and dark mode icons.
- Task Manager: Fixed high CPU usage caused by background WMI provider host polling.
- Settings: Added Wi-Fi 7 (802.11be) multi-link operation (MLO) status display.
- File Explorer: Added duplicate tab shortcut (Ctrl + Shift + T).

Fixes & Improvements:
- Fixed an issue where context menu in File Explorer could become transparent or flicker on multiple monitors.
- Fixed an issue causing audio crackling when switching default audio endpoints.

Known Issues:
- [File Explorer] Navigating between Home and Gallery might cause temporary lockups for users with large OneDrive sync libraries.
- [Voice Access] Commands might fail in non-English UI locales.`
  },
  {
    id: 'kb5040442-bitlocker',
    title: 'Security Patch KB5040442 prompts BitLocker Recovery screen after boot on OEM laptops',
    kbNumber: 'KB5040442',
    windowsVersion: 'Windows 11 / Windows 10',
    category: 'Security Patch',
    source: 'ms_release_health',
    date: '2025-02-18',
    link: 'https://support.microsoft.com/help/5040442',
    summaryNote: 'После установки патча безопасности ноутбуки требуют 48-значный ключ восстановления BitLocker из-за обновления списков Secure Boot DBX.',
    rawHtml: `Following recent security updates (KB5040442 for Windows 11 and KB5040425 for Windows 10), Microsoft has confirmed that devices with Device Encryption or BitLocker enabled may boot directly into the BitLocker Recovery screen asking for the 48-digit recovery key.

Cause:
Secure Boot DBX revocation list changes triggered TPM validation mismatch on certain OEM firmware (Dell, Lenovo, HP).

Mitigation & Fix:
1. Locate BitLocker 48-digit key in your Microsoft Account (https://account.microsoft.com/devices/recoverykey) or Active Directory / Intune portal.
2. Enter key once to boot into Windows.
3. Open Admin PowerShell and run:
   "Suspend-BitLocker -MountPoint 'C:' -RebootCount 1"
4. Update motherboard BIOS/UEFI firmware to the latest manufacturer version.
5. Resume BitLocker: "Resume-BitLocker -MountPoint 'C:'".`
  }
];
