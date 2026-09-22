---
title: 'PyInstaller相关'
published: 2026-09-22
description: '怎么感觉有一亿年没写过逆向了'
author: 'dxfaker'
image: '/images/post/ae43dbccbdcc3eeb9eddbe75722ee94e.jpg'
tags: ['reverse','wp']
category: 'wp'
toc: true

---

# 九转蛇肠

查壳没什么问题

进来看逻辑

ctrl+E

start

```c
__int64 start()
{
  sub_14000DB80();
  return sub_14000D770();
}
```

> - 它把这三个参数传给 `sub_140001000`，完全符合 `main(int argc, char **argv, char **envp)` 的签名。
>
> MSVC 启动流程的最后一步：初始化完成后调用用户写的 `main`

main

```c
int __fastcall main(int argc, const char **argv, const char **envp)
{
  dword_140043D30[0] = argc;
  *(_QWORD *)&dword_140043D30[2] = argv;
  return sub_1400040C0(dword_140043D30);
}
```

sub_1400040C0

```c
__int64 __fastcall sub_1400040C0(__int64 a1)
{
  __int64 v2; // rax
  __int64 v4; // rax
  __int64 *v5; // r12
  __int64 v6; // rcx
  __int64 v7; // rdx
  unsigned __int8 *v8; // rax
  int v9; // r8d
  bool v10; // bl
  unsigned __int8 *v11; // rax
  void *v12; // rdi
  int v13; // ebx
  __int64 v14; // rax
  void *v15; // rbx
  bool v16; // di
  char *v17; // rax
  char *v18; // rbx
  char v19; // al
  LPCWSTR v20; // rcx
  __int64 v21; // rax
  __int64 v22; // rbx
  __int64 v23; // rax
  int v24; // eax
  __int64 v25; // rbp
  unsigned __int64 v26; // rbx
  int v27; // r9d
  int v28; // eax
  char v29; // cl
  char v30; // al
  unsigned __int8 *v31; // rax
  int v32; // r8d
  char v33; // al
  const char *v34; // rax
  char *v35; // rbx
  const CHAR *v36; // rbp
  __int64 v37; // rax
  __int64 v38; // rcx
  unsigned int i; // ebx
  char v40; // al
  __int64 v41; // rax
  _QWORD *v42; // rbx
  const char *v43; // rcx
  char v44; // al
  unsigned int v45; // edi
  char v46; // al
  LPCWSTR lpLibFileName[2]; // [rsp+20h] [rbp-2048h] BYREF
  WCHAR PathName[4096]; // [rsp+30h] [rbp-2038h] BYREF

  v2 = sub_140018840(2);
  sub_1400195E8(v2, 0);
  if ( (int)sub_140003FB0(a1 + 16) < 0 )
    return 0xFFFFFFFFLL;
  v4 = sub_1400018E0((const char *)(a1 + 16));
  v5 = (__int64 *)(a1 + 8208);
  *(_QWORD *)(a1 + 8208) = v4;
  if ( v4 )
  {
    sub_140001BF0(a1 + 4112, 4096, "%s", (const char *)(a1 + 16));
    goto LABEL_5;
  }
  v21 = sub_140004F80(a1 + 16, "rb");
  v22 = v21;
  if ( !v21 )
  {
LABEL_27:
    sub_1400033A0(
      "Could not load PyInstaller's embedded PKG archive from the executable (%s)\n",
      (const char *)(a1 + 16));
    return 0xFFFFFFFFLL;
  }
  lpLibFileName[0] = (LPCWSTR)0xE0B0A0B0D49454DLL;
  if ( !sub_140008DC0(v21, lpLibFileName, 8) )
  {
    sub_140010DB0(v22);
    goto LABEL_27;
  }
  sub_140001BF0(a1 + 4112, 4096, "%s", (const char *)(a1 + 16));
  *(_DWORD *)(sub_14002E100(a1 + 4112) + a1 + 4109) = 6777712;
  v23 = sub_1400018E0((const char *)(a1 + 4112));
  *v5 = v23;
  if ( !v23 )
  {
    sub_1400033A0("Could not side-load PyInstaller's PKG archive from external file (%s)\n", (const char *)(a1 + 4112));
    return 0xFFFFFFFFLL;
  }
LABEL_5:
  v6 = *v5;
  *(_BYTE *)(a1 + 8232) = *(_BYTE *)(*v5 + 4120);
  v7 = *(_QWORD *)(v6 + 4128);
  *(_BYTE *)(a1 + 8216) = v7 != 0;
  if ( v7 )
  {
    v8 = (unsigned __int8 *)sub_140009890("PYINSTALLER_SUPPRESS_SPLASH_SCREEN");
    if ( v8 )
    {
      v9 = *v8 - 49;
      if ( *v8 == 49 )
        v9 = v8[1];
      *(_BYTE *)(a1 + 8217) = v9 == 0;
    }
    sub_140017AE0(v8);
  }
  v10 = 0;
  v11 = (unsigned __int8 *)sub_140009890("PYINSTALLER_RESET_ENVIRONMENT");
  v12 = v11;
  if ( v11 )
  {
    v13 = *v11 - 49;
    if ( *v11 == 49 )
      v13 = v11[1];
    sub_140009A00("PYINSTALLER_RESET_ENVIRONMENT");
    v10 = v13 == 0;
  }
  sub_140017AE0(v12);
  if ( v10 )
    goto LABEL_19;
  v14 = sub_140009890("_PYI_ARCHIVE_FILE");
  v15 = (void *)v14;
  v16 = 1;
  if ( v14 )
    v16 = (unsigned int)sub_14002E080(a1 + 4112, v14) != 0;
  sub_140017AE0(v15);
  if ( v16 )
  {
LABEL_19:
    sub_1400099A0("_PYI_ARCHIVE_FILE", a1 + 4112);
    sub_140009A00("_PYI_APPLICATION_HOME_DIR");
    sub_140009A00("_PYI_PARENT_PROCESS_LEVEL");
    sub_140009A00("_PYI_SPLASH_IPC");
  }
  v17 = (char *)sub_140009890("_PYI_PARENT_PROCESS_LEVEL");
  v18 = v17;
  if ( v17 && *v17 )
  {
    v19 = sub_1400193CC(v17, lpLibFileName, 0);
    v20 = lpLibFileName[0];
    *(_BYTE *)(a1 + 8234) = v19;
    if ( *(_BYTE *)v20 )
    {
      sub_1400033A0("Invalid value in _PYI_PARENT_PROCESS_LEVEL: %s\n", v18);
      return 0xFFFFFFFFLL;
    }
  }
  else
  {
    *(_BYTE *)(a1 + 8234) = -2;
  }
  sub_140017AE0(v18);
  v24 = *(char *)(a1 + 8234);
  if ( *(_BYTE *)(a1 + 8234) == 0xFE )
  {
    if ( *(_BYTE *)(a1 + 8232) )
    {
      *(_BYTE *)(a1 + 8233) = 0;
      v27 = 0;
      goto LABEL_44;
    }
  }
  else if ( (_BYTE)v24 )
  {
    if ( (_BYTE)v24 != 1 )
    {
      sub_1400033A0("Invalid parent process level: %d\n", v24);
      return 0xFFFFFFFFLL;
    }
    *(_BYTE *)(a1 + 8233) = 2;
    goto LABEL_36;
  }
  v27 = 1;
  *(_BYTE *)(a1 + 8233) = 1;
LABEL_44:
  sub_140001BF0(lpLibFileName, 8, "%d", v27);
  if ( (int)sub_1400099A0("_PYI_PARENT_PROCESS_LEVEL", lpLibFileName) < 0 )
  {
    sub_1400033A0("Failed to set _PYI_PARENT_PROCESS_LEVEL environment variable!\n");
    return 0xFFFFFFFFLL;
  }
LABEL_36:
  v25 = *v5;
  v26 = *(_QWORD *)(*v5 + 4104);
  if ( v26 < *(_QWORD *)(*v5 + 4112) )
  {
    do
    {
      if ( *(_BYTE *)(v26 + 17) == 111 )
      {
        if ( (unsigned int)sub_14002E1C0(v26 + 18, "pyi-python-flag", 15) )
        {
          if ( !(unsigned int)sub_14002E1C0(v26 + 18, "pyi-runtime-tmpdir", 18) )
            *(_QWORD *)(a1 + 12400) = v26 + 37;
          if ( !(unsigned int)sub_14002E1C0(v26 + 18, "pyi-contents-directory", 22) )
            *(_QWORD *)(a1 + 12408) = v26 + 41;
          if ( !(unsigned int)sub_14002E1C0(v26 + 18, "pyi-hide-console", 16) )
          {
            if ( (unsigned int)sub_14002E080(v26 + 35, "hide-early") )
            {
              if ( (unsigned int)sub_14002E080(v26 + 35, "minimize-early") )
              {
                if ( (unsigned int)sub_14002E080(v26 + 35, "hide-late") )
                {
                  v28 = sub_14002E080(v26 + 35, "minimize-late");
                  v29 = 0;
                  if ( !v28 )
                    v29 = 4;
                  *(_BYTE *)(a1 + 12416) = v29;
                }
                else
                {
                  *(_BYTE *)(a1 + 12416) = 2;
                }
              }
              else
              {
                *(_BYTE *)(a1 + 12416) = 3;
              }
            }
            else
            {
              *(_BYTE *)(a1 + 12416) = 1;
            }
          }
        }
        else if ( !(unsigned int)sub_14002E1C0(v26 + 34, "Py_GIL_DISABLED", 15) )
        {
          *(_BYTE *)(a1 + 12417) = 1;
        }
      }
      v26 = sub_1400018D0(v25, v26);
    }
    while ( v26 < *(_QWORD *)(v25 + 4112) );
  }
  v30 = *(_BYTE *)(a1 + 12416);
  if ( v30 == 1 )
  {
    sub_140009F70();
  }
  else if ( v30 == 3 )
  {
    sub_14000A0A0();
  }
  v31 = (unsigned __int8 *)sub_140009890("PYINSTALLER_STRICT_UNPACK_MODE");
  if ( v31 )
  {
    v32 = *v31 - 48;
    if ( *v31 == 48 )
      v32 = v31[1];
    *(_BYTE *)(a1 + 12344) = v32 != 0;
  }
  sub_140017AE0(v31);
  if ( *(_BYTE *)(a1 + 8232) )
  {
    v33 = *(_BYTE *)(a1 + 8233);
    if ( v33 != -1 && (v33 || *(_BYTE *)(a1 + 8234) == 0xFF) )
    {
      v34 = (const char *)sub_140009890("_PYI_APPLICATION_HOME_DIR");
      v35 = (char *)v34;
      if ( !v34 || !*v34 )
      {
        sub_1400033A0("_PYI_APPLICATION_HOME_DIR environment variable is not defined!\n");
        return 0xFFFFFFFFLL;
      }
      v36 = (const CHAR *)(a1 + 8235);
      if ( (int)sub_140001BF0(a1 + 8235, 4096, "%s", v34) >= 4096 )
      {
        sub_1400033A0("Path exceeds PYI_PATH_MAX limit.\n");
        sub_140017AE0(v35);
        return 0xFFFFFFFFLL;
      }
      sub_140017AE0(v35);
    }
    else
    {
      v37 = sub_140009F80();
      *(_QWORD *)(a1 + 12352) = v37;
      if ( !v37 )
      {
        sub_1400033A0("Failed to initialize security descriptor for temporary directory!\n");
        return 0xFFFFFFFFLL;
      }
      if ( (int)sub_1400096C0(a1) < 0 )
      {
        sub_1400033A0("Could not create temporary directory!\n");
        return 0xFFFFFFFFLL;
      }
      v36 = (const CHAR *)(a1 + 8235);
      if ( (int)sub_1400099A0("_PYI_APPLICATION_HOME_DIR", a1 + 8235) < 0 )
      {
        sub_1400033A0("Failed to set application home directory via environment variable!\n");
        return 0xFFFFFFFFLL;
      }
    }
  }
  else
  {
    sub_140004EB0(PathName, a1 + 16);
    v36 = (const CHAR *)(a1 + 8235);
    v38 = a1 + 8235;
    if ( *(_QWORD *)(a1 + 12408) )
      sub_140004FF0(v38, PathName);
    else
      sub_140001BF0(v38, 4096, "%s", (const char *)PathName);
  }
  if ( *(_BYTE *)(a1 + 8232) && !*(_BYTE *)(a1 + 8233) )
  {
    lpLibFileName[0] = L"VCRUNTIME140.dll";
    lpLibFileName[1] = L"VCRUNTIME140_1.dll";
    SetDllDirectoryW(0);
    for ( i = 0; i < 2; ++i )
      LoadLibraryExW(lpLibFileName[i], 0, 0x1000u);
  }
  if ( !sub_14000A2C0(v36, (int)PathName) )
  {
    sub_1400033A0("Failed to convert DLL search path!\n");
    return 0xFFFFFFFFLL;
  }
  SetDllDirectoryW(PathName);
  if ( *(_BYTE *)(a1 + 8216) )
  {
    if ( *(_BYTE *)(a1 + 8217) || (v40 = *(_BYTE *)(a1 + 8233), v40 >= 2) )
    {
      sub_1400099A0("_PYI_SPLASH_IPC", "0");
      goto LABEL_112;
    }
    if ( *(_BYTE *)(a1 + 8232) )
    {
      if ( v40 )
        goto LABEL_112;
    }
    else if ( v40 != 1 )
    {
      goto LABEL_112;
    }
    v41 = sub_140008040();
    v42 = (_QWORD *)(a1 + 8224);
    *(_QWORD *)(a1 + 8224) = v41;
    if ( (unsigned int)sub_140008560(v41, a1) )
    {
      v43 = "Failed to load splash screen resources!\n";
LABEL_110:
      sub_140003680(v43);
      sub_140008230(*v42);
      sub_140007FF0(a1 + 8224);
      goto LABEL_112;
    }
    if ( *(_BYTE *)(a1 + 8232) && (unsigned int)sub_140008080(*v42, a1) )
    {
      v43 = "Failed to unpack splash screen dependencies from PKG archive!\n";
      goto LABEL_110;
    }
    if ( (unsigned int)sub_1400083E0(*v42) )
    {
      v43 = "Failed to load Tcl/Tk shared libraries for splash screen!\n";
      goto LABEL_110;
    }
    if ( (unsigned int)sub_140008800(*v42, a1 + 16) )
    {
      v43 = "Failed to start splash screen!\n";
      goto LABEL_110;
    }
  }
LABEL_112:
  if ( !*(_BYTE *)(a1 + 8232) || *(_BYTE *)(a1 + 8233) )
  {
    v46 = *(_BYTE *)(a1 + 12416);
    if ( v46 == 2 )
    {
      sub_140009F70();
    }
    else if ( v46 == 4 )
    {
      sub_14000A0A0();
    }
    v45 = sub_140003C60(a1);
    sub_140003F80(a1);
    sub_140008230(*(_QWORD *)(a1 + 8224));
    sub_140007FF0(a1 + 8224);
    return v45;
  }
  if ( (int)sub_140003CE0(a1) < 0 )
    return (unsigned int)-1;
  sub_140009F50(a1 + 12352);
  v44 = *(_BYTE *)(a1 + 12416);
  if ( v44 == 2 )
  {
    sub_140009F70();
  }
  else if ( v44 == 4 )
  {
    sub_14000A0A0();
  }
  v45 = sub_140009A40(a1);
  sub_140008230(*(_QWORD *)(a1 + 8224));
  sub_140007FF0(a1 + 8224);
  if ( (int)sub_140009940(v36) >= 0 || (int)sub_14000A0B0(a1) >= 0 )
  {
LABEL_126:
    sub_140001890(a1 + 8208);
    return v45;
  }
  if ( !*(_BYTE *)(a1 + 12344) )
  {
    sub_140003680("Failed to remove temporary directory: %s\n", v36);
    goto LABEL_126;
  }
  sub_1400033A0("Failed to remove temporary directory: %s\n", v36);
  sub_140001890(a1 + 8208);
  return (unsigned int)-1;
}
```

看半天都没看明白对吧，这就对喽

## PyInstaller

> PyInstaller 是一个可以将 Python 源代码打包成跨平台独立可执行文件的工具。无论是 Windows、Linux 还是 macOS，PyInstaller 都能够创建不依赖于 Python 解释器的二进制文件。

前面的main有很多特征啊

例如

```
PYINSTALLER_SUPPRESS_SPLASH_SCREEN
PYINSTALLER_RESET_ENVIRONMENT
_PYI_ARCHIVE_FILE
_PYI_APPLICATION_HOME_DIR
_PYI_PARENT_PROCESS_LEVEL
_PYI_SPLASH_IPC
pyi-python-flag
pyi-runtime-tmpdir
pyi-contents-directory
pyi-hide-console
PYZ archive entry not found in the TOC!
python311.dll
PYZ.pyz
_MEIPASS
```

只要看到 `PYINSTALLER_`、`_PYI_`、`pyi-`、`PYZ`、`_MEIPASS` 这几个前缀，基本就可以确定是 PyInstaller了

```bash
(base) dxfaker@LAPTOP-US9FCLPD:/mnt/d/ctf/flag/re/moectf/九转蛇肠$ python -m pyinstxtractor_ng chall16.exe
[+] Processing chall16.exe
[+] Pyinstaller version: 2.1+
[+] Python version: 3.11
[+] Length of package: 6122661 bytes
[+] Found 21 files in CArchive
[+] Beginning extraction...please standby
```

https://pylingual.io/

.pyc->.py

main

```python
# Decompiled with PyLingual (https://pylingual.io)
# Internal filename: 'main.py'
# Bytecode version: 3.11a7e (3495)
# Source timestamp: 1970-01-01 00:00:00 UTC (0)

import amber
import almond
import aurora
import birch
import willow
import citrus
import copper
import indigo
import jasper
import quartz
import lilac
import cedar
import cherry
import forest
import pebble
import ember
import lagoon
import juniper
import marble
import meadow
import orchid
import bamboo
import dahlia
import ginger
import hazel
import ripple
import bronze
import flag
import secret
def start() -> None:
    lagoon.initialize()
    ginger.require(dahlia.self_test())
    sess = lilac.Session()
    for line in amber.render():
        print(line)
    print(hazel.first())
    value = input(almond.PROMPT)
    value = juniper.run(indigo.clean(value), (marble.apply, meadow.apply, orchid.apply))
    sess.touch()
    aurora.bump()
    pebble.emit('input', len(value))
    ok = indigo.acceptable(value) and quartz.is_text(value) and flag.verify(value)
    print(ember.choose(ok, almond.SUCCESS, almond.FAILURE))
    sess.close()
if __name__ == '__main__':
    start()
```

重点是` ok = indigo.acceptable(value) and quartz.is_text(value) and flag.verify(value)`

都有flag了你还不去找他吗

flag

```python
# Decompiled with PyLingual (https://pylingual.io)
# Internal filename: 'flag.py'
# Bytecode version: 3.11a7e (3495)
# Source timestamp: 1970-01-01 00:00:00 UTC (0)

MASK = 4294967295
DELTA = 2654435769
ROUNDS = 32
KEY = [1297040707, 1413886512, 842419013, 1498173260]
TARGET = bytes.fromhex('c843f13ade746b100355315af80e9f7850491f23533abee5cffb25e117baeffdc4548690f5870eba9b14a7d4f57b291c')
def _mix(v: int, s: int, ka: int, kb: int) -> int:
    return ((v << 4) + ka ^ v + s ^ (v >> 5) + kb) & MASK
def encrypt_block(block: bytes) -> bytes:
    if len(block) != 8:
        raise ValueError('block size must be 8')
    else:
        v0 = int.from_bytes(block[0:4], 'little')
        v1 = int.from_bytes(block[4:8], 'little')
        k0, k1, k2, k3 = KEY
        s = 0
        for _ in range(ROUNDS):
            s = s + DELTA & MASK
            v0 = v0 + _mix(v1, s, k0, k1) & MASK
            v1 = v1 + _mix(v0, s, k2, k3) & MASK
        return v0.to_bytes(4, 'little') + v1.to_bytes(4, 'little')
def encrypt(data: bytes) -> bytes:
    if len(data) % 8:
        return b''
    else:
        out = bytearray()
        for i in range(0, len(data), 8):
            out.extend(encrypt_block(data[i:i + 8]))
        return bytes(out)
def verify(user_input: str) -> bool:
    try:
        raw = user_input.encode('utf-8')
    except Exception:
        return False
    if len(raw) != 48:
        return False
    else:
        return encrypt(raw) == TARGET
```

注意到

```python
return ((v << 4) + ka ^ v + s ^ (v >> 5) + kb) & MASK
```

secret

```python
# Decompiled with PyLingual (https://pylingual.io)
# Internal filename: 'secret.py'
# Bytecode version: 3.11a7e (3495)
# Source timestamp: 1970-01-01 00:00:00 UTC (0)

import flag
MASK = 4294967295
def _patch() -> None:
    flag.KEY[1] ^= 324508639
    flag.DELTA = (flag.DELTA ^ 12648430) & MASK
_patch()
del _patch
```

标准TEA

你知道的，我一般都用CPP，但是这个题~~貌似超出我的能力范围了（~~有点麻烦

所以

```python
MASK = 0xFFFFFFFF
ROUNDS = 32


DELTA_INIT = 2654435769         
KEY_INIT = [1297040707, 1413886512, 842419013, 1498173260]


KEY = KEY_INIT[:]
KEY[1] ^= 324508639              # 0x13579BDF
DELTA = (DELTA_INIT ^ 12648430) & MASK   # 0xC0FFEE

TARGET = bytes.fromhex(
    'c843f13ade746b100355315af80e9f7850491f23533abee5cffb25e117baeffdc4548690f5870eba9b14a7d4f57b291c'
)

def _mix(v, s, ka, kb):
    return (((v << 4) + ka) ^ (v + s) ^ ((v >> 5) + kb)) & MASK

def decrypt_block(block):
    assert len(block) == 8
    v0 = int.from_bytes(block[0:4], 'little')
    v1 = int.from_bytes(block[4:8], 'little')
    k0, k1, k2, k3 = KEY
    s = (DELTA * ROUNDS) & MASK
    for _ in range(ROUNDS):
        v1 = (v1 - _mix(v0, s, k2, k3)) & MASK
        v0 = (v0 - _mix(v1, s, k0, k1)) & MASK
        s = (s - DELTA) & MASK
    return v0.to_bytes(4, 'little') + v1.to_bytes(4, 'little')

def decrypt(data):
    out = bytearray()
    for i in range(0, len(data), 8):
        out.extend(decrypt_block(data[i:i+8]))
    return bytes(out)

raw = decrypt(TARGET)
print("raw bytes:", raw)
try:
    print("raw text :", raw.decode('utf-8'))
except Exception as e:
    print("decode error:", e)

```



