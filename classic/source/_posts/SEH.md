---
title: 'SEH问题处理'

date: 2026-07-25 00:00:00

description: '属于WP吧，讲讲处理思路'

author: 'dxfaker'

cover: '/images/post/1bf95a7d88367cf98b58f9feac1c8ffd.jpg'

tags: ['reverse','c','SEH']

categories: ['wp']

toc: true
comments: true
---

# 前言

感谢leyi提供的南区美照

经过了激烈的期末月斗争，我的电分还是挂了(目前还不清楚有没有补考)。

然后从暑假开始复健逆向。

第一天我就写了两个题目，一个是hex的，开010拉到底部就结束战斗了，另外一个就是今天讲的SEH。

# 你需要知道的

1. SEH是什么

>`SEH`（Structured Exception Handling，结构化异常处理）是 **Windows 操作系统提供的一种底层异常处理机制**。它与 C++ 的 `try/catch` 不同，`SEH` 是操作系统层面的机制，而 `try/catch` 等 C++ 异常处理在 Windows 上通常也是基于 `SEH` 实现的。

异常发生后，大概顺序是：内核->调试器->VEH->SEH

>在线程初始化的时候，会自动在栈中安装一个SEH结构体，作为默认异常处理，他的next就是0xFFFFFFFFF，而这个异常程序大家应该都很熟悉，就是windows程序崩溃时那个弹窗，打印出来出错函数地址。
>
>如果程序中使用了try、excpt、assert来处理异常信息，那么编译器就会在栈中压入一个SEH结构体，同时插入链表中。
>
>当出现异常的时候，操作系统会先中断程序，然后从TIB中取出第一个SEH结构体（也就是最近的SEH结构），使用其中的handler处理这个异常。
>
>如果这个异常处理函数处理不了这个异常，那么就顺着next往上找别的异常处理函数，直到找到一个可以处理这个异常的函数或者到底部，也就是弹出错误窗口然后杀死线程。
>
>通常处理完异常后，需要执行展开（Unwind）操作，该操作先通知目标结点前的各异常处理函数释放资源，然后将之前的SEH链全部删除。该操作通常由各高级语言Rtl模块来完成，Win32汇编操作时既可以不展开，也可以手工展开，还可以使用RtlUnwind函数展开。

# 题目内容

西电的[强壮逆向人 - 西电 CTF 终端](https://ctf.xidian.edu.cn/training/2?challenge=522)这个题

查壳发现没有什么问题，然后就可以拖进IDA里面看代码了

<img src="/images/post/屏幕截图 2026-07-25 143104.png" alt="屏幕截图 2026-07-25 143104" />

乍一看，并没有什么难的，然后就去打开byte_140005010、dword_140005000、unk_140005110、sub_140001020看一下内容。然后我就直接去搓解密脚本了。

<img src="/images/post/屏幕截图 2026-07-25 143827.png" alt="屏幕截图 2026-07-25 143827" />

剩下部分数据处理好就可以输出解密脚本了。

但能解出来吗，很显然不行

那问题出在哪呢

`puts("Can you read my assembly in exception?");`

以及题目提示

>云之君在track神的电脑里找到了他珍藏的flag，于是急匆匆拿出了文件想要逆出flag。 可是按照IDA反编译的伪C代码解密出来的全是乱码，这是怎么回事呢？ 幸好万能的track神告诉云之君，IDA也会骗人，这个伪C代码是假的，想要拿到flag只能分析汇编代码！ 悲剧的是，云之君是一个只会F5的家伙，一点汇编也看不懂呜呜呜，这可怎么办呢

然后就需要我们去看汇编<img src="/images/post/屏幕截图 2026-07-25 144520.png" alt="屏幕截图 2026-07-25 144520" />

可以直接看到有SEH的字样，拉到`v5 = (127 * v5 + 102) % 255;`这句话的汇编代码时，发现里面大有文章。



<img src="/images/post/屏幕截图 2026-07-25 144743.png" alt="屏幕截图 2026-07-25 144743" />

这里快速复习一下汇编代码

| `imul` | 有符号整数乘法                              |
| ------ | ------------------------------------------- |
| `add`  | 加法                                        |
| `cdq`  | 将 `eax` 符号扩展为 `edx:eax`（用于除法）   |
| `idiv` | 有符号整数除法（商在 `eax`，余数在 `edx`）  |
| `sar`  | 算术右移（带符号位填充，相当于除以 2 的幂） |
| `xor`  | 按位异或                                    |
| `mov`  | 数据传输                                    |
| `jmp`  | 无条件跳转                                  |

```assembly
    mov     eax, [rsp+0D8h+var_B4]        ; eax = var_B4 (更新后的值)
    sar     eax, 7                        ; eax = eax >> 7 (算术右移7位，即除以128)
    mov     [rsp+0D8h+var_B0], eax        ; var_B0 = eax (保存结果)
    mov     eax, 1                        ; eax = 1
    cdq                                   ; 扩展 eax 为 edx:eax
    idiv    [rsp+0D8h+var_B0]             ; eax = 1 / var_B0 (整数除法)
    mov     [rsp+0D8h+var_B0], eax        ; var_B0 = eax (结果)
    jmp     short loc_140001212            ; 跳转到后续正常流程
```

这个时候，就可以试着先把v5（`int v5; // [rsp+24h] [rbp-B4h]`）的值带进去变换了。

然后就会发现一个问题，右移7位会导致出现 1 / 0 的情况，这显然是会报错的。

这个时候就需要SEH出动了，也就是`_except`部分

```assembly
loc_1400011E9:
    imul    eax, cs:dword_140005000, 61h   ; eax = dword_140005000 * 97
    add     eax, 65h                       ; eax = eax + 101
    cdq                                    ; 符号扩展
    mov     ecx, 0E9h                      ; ecx = 233
    idiv    ecx                            ; edx = eax % 233
    mov     eax, edx                       ; eax = 余数
    mov     cs:dword_140005000, eax        ; dword_140005000 = 余数 (更新全局变量)
    mov     eax, cs:dword_140005000        ; eax = 更新后的值
    xor     eax, 29h                       ; eax = eax ^ 0x29 (异或 41)
    mov     cs:dword_140005000, eax        ; dword_140005000 = eax (最终值)
```

然后我就发现问题了，dword_140005000是会随着v5的更新而更新的。

理解这个之后，解密就好写了。由于XOR的对称性，其实跟我第一轮的密码相比并没有什么太大的区别，只需要加上校验判断以及如果v5右移后的处理（也就是更新dword_140005000）即可。

我的解密脚本

```cpp
#include<iostream>
using namespace std;
int main() {
    unsigned char key_table[256] = {
    0xAC,0x04,0x58,0xB0,0x45,0x96,0x9F,0x2E,0x41,0x15,0x18,0x29,0xB1,0x33,0xAA,0x12,
    0x0D,0x89,0xE6,0xFA,0xF3,0xC4,0xBD,0xE7,0x70,0x8A,0x94,0xC1,0x85,0x9D,0xA3,0xF2,
    0x3F,0x82,0x8E,0xD7,0x03,0x93,0x3D,0x13,0x05,0x6B,0x41,0x03,0x96,0x76,0xE3,0xB1,
    0x8A,0x4A,0x22,0x55,0xC4,0x19,0xF5,0x55,0xA6,0x1F,0x0E,0x61,0x27,0xCB,0x1F,0x9E,
    0x5A,0x7A,0xE3,0x15,0x40,0x94,0x47,0xDE,0x00,0x01,0x91,0x66,0xB7,0xCD,0x22,0x64,
    0xF5,0xA5,0x9C,0x68,0xA5,0x52,0x86,0xBD,0xB0,0xDD,0x76,0x28,0xAB,0x16,0x95,0xC5,
    0x26,0x2C,0xF6,0x39,0xBE,0x00,0xA5,0xAD,0xE3,0x93,0x9E,0xE3,0x05,0xA0,0xB0,0x1D,
    0xB0,0x16,0x0B,0x5B,0x33,0x95,0xA4,0x09,0x16,0x87,0x56,0x1F,0x83,0x4E,0x4A,0x3C,
    0x55,0x36,0x6F,0xBB,0x4C,0x4B,0x9D,0xB1,0xAE,0xE5,0x8E,0xC8,0xFB,0x0E,0x29,0x8A,
    0xBB,0xFC,0x20,0x62,0x04,0x2D,0x80,0x61,0xD6,0xC1,0xCC,0x3B,0x89,0xC5,0x8B,0xD5,
    0x26,0x58,0xD6,0xB6,0xA0,0x50,0x75,0xAB,0x17,0x83,0x7F,0x37,0x2B,0xA0,0x1D,0x2C,
    0xCF,0xC7,0xE0,0xE5,0x49,0xC9,0xFA,0x6B,0xC0,0x98,0x66,0x99,0x92,0x00,0x02,0xD4,
    0x75,0x46,0x22,0x05,0x35,0xD1,0x4B,0xC5,0xAD,0xE0,0x8E,0x45,0x3B,0x50,0x15,0xB5,
    0x2E,0x85,0x30,0x89,0x54,0x12,0xDE,0xF1,0x5A,0xF0,0x2B,0xA7,0x1B,0x4A,0x26,0x5D,
    0x98,0xD4,0xA1,0xBE,0xD1,0x4D,0x7E,0x38,0xDE,0x0B,0x0A,0x54,0xB8,0x73,0x6D,0xAD,
    0x8C,0x1E,0xD9,0x31,0x5F,0x56,0x7E,0xBD,0x48,0x32,0x98,0x2E,0x3E,0xEB,0xA2,0x1D
    };
    unsigned char checkout[51] = {
        0x1E,0x70,0x7A,0x6E,0xEA,0x83,0x9E,0xEF,
        0x96,0xE2,0xB2,0xD5,0x99,0xBB,0xBB,0x78,
        0xB9,0x3D,0x6E,0x38,0x42,0xC2,0x86,0xFF,
        0x63,0xBD,0xFA,0x79,0xA3,0x6D,0x60,0x94,
        0xB3,0x42,0x11,0xC3,0x90,0x89,0xBD,0xEF,
        0xD4,0x97,0xF8,0x7B,0x8B,0x0B,0x2D,0x75,
        0x7E,0xDD,0xCB
    };
    int pla = 25;
    int v5 = 0;
    for (int i = 0; i < 51; i++) {
        v5 = (127 * v5 + 102) % 255;
        if (v5 >> 7 == 0) {
            pla = ((pla * 97 + 101) % 233) ^ 41;

        }
        checkout[i] ^= key_table[pla];
    }
    cout << checkout << endl;
    return 0;
}
```

也就是说，不要过于依赖F5出来的东西了，去跟踪汇编代码看看哪里隐藏起来了。
