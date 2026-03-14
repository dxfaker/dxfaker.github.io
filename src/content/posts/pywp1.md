---
title: '今日一题'
published: 2026-03-02
description: '解题思路之类的'
author: 'dxfaker'
image: '/images/post/26.3.2.1.jpg'
tags: ['python']
category: 'WP'
toc: true
---
# 写在前面

镇楼：这样的好兄弟不会再有了

作为刚踏进这个世界的蛆，自然看到这种加密代码很是头疼，于是便记录下来，以便于之后理清逻辑

# 题目
## [SWPUCTF 2021 新生赛]简简单单的解密
```python
import base64,urllib.parse
key = "HereIsFlagggg"
flag = "xxxxxxxxxxxxxxxxxxx"

s_box = list(range(256))
j = 0
for i in range(256):
    j = (j + s_box[i] + ord(key[i % len(key)])) % 256
    s_box[i], s_box[j] = s_box[j], s_box[i]
res = []
i = j = 0
for s in flag:
    i = (i + 1) % 256 #我够吧一时间没反应过来,这个的结果是它本身(i+1)
    j = (j + s_box[i]) % 256
    s_box[i], s_box[j] = s_box[j], s_box[i]
    t = (s_box[i] + s_box[j]) % 256
    k = s_box[t]
    res.append(chr(ord(s) ^ k))
cipher = "".join(res)
crypt = (str(base64.b64encode(cipher.encode('utf-8')), 'utf-8'))
enc = str(base64.b64decode(crypt),'utf-8')
enc = urllib.parse.quote(enc)
print(enc)
# enc = %C2%A6n%C2%87Y%1Ag%3F%C2%A01.%C2%9C%C3%B7%C3%8A%02%C3%80%C2%92W%C3%8C%C3%BA
```

代码解析

### range(256)

>在 Python 中，range(256) 是一个内置函数 range() 的调用，它生成一个不可变的整数序列，从 0 开始，一直到 255（即包含 0，不包含 256）。换句话说，它产生的数字是：0, 1, 2, 3, ..., 254, 255，总共 256 个数。

```python
   s_box[i], s_box[j] = s_box[j], s_box[i]
```
>Python 在赋值时，会先计算等号右边的所有表达式，然后把结果
>同时赋值给左边的变量。

所以这里：
先取出 s_box[j] 的值，记为 temp_j。
再取出 s_box[i] 的值，记为 temp_i。
然后将 temp_j 赋给 s_box[i]，将 temp_i 赋给 s_box[j]。

**这行代码会把 s_box[i] 和 s_box[j] 的值互相交换。**

```python
crypt = (str(base64.b64encode(cipher.encode('utf-8')), 'utf-8'))
```
这一行代码的作用是将字符串 cipher 进行 Base64 编码，并将结果以字符串形式赋值给变量 crypt。下面逐步拆解：

>cipher.encode('utf-8')
>将字符串 cipher 按照 UTF-8 编码转换为字节串（bytes 类型），因为 Base64 编码操作需要输入字节数据。
>
>base64.b64encode(...)
>对得到的字节串进行 Base64 编码，返回一个新的字节串，内容为 Base64 编码后的 ASCII 字符（例如 b'aGVsbG8='）。
>
>str(..., 'utf-8')
>将 Base64 编码后的字节串使用 UTF-8 解码为普通的 Python 字符串。这里 str(字节串, encoding) 等价于 字节串.decode(encoding)。由于 Base64 结果只包含 ASCII 字符，用 UTF-8 解码完全正确。

最终 crypt 就得到了一个不含 b'' 前缀的纯 Base64 字符串，可以直接用于后续处理或输出。


```python
enc = urllib.parse.quote(enc)
```
 这行代码的作用是对字符串 enc 进行 URL 编码（也叫百分号编码），然后将编码后的结果重新赋值给 enc。

### 草稿部分

遍历256
j+=执行的次数+ key的第(i取key长度的余数)位数字符的acsii
交换sbox中的i,j位数据

for s in flag
 i+=1
 j=+sbox的j位元素
 交换sbox中的i,j位数据
 t = sbox中的i和j位数据相加(不过256)
 k = sbox[t]
 res有序放入(s转码)^k后的转换的字符
cipher = res全部字符连成一串
crypt = 一个不含 b'' 前缀的cipher纯 Base64 字符串，可以直接用于后续处理或输出。
enc = utf-8的将ctypt字符串化作原始的字符串的字符串
对enc进行 url编码

## 答案
```python
import base64,urllib.parse
key = "HereIsFlagggg"
enc = "%C2%A6n%C2%87Y%1Ag%3F%C2%A01.%C2%9C%C3%B7%C3%8A%02%C3%80%C2%92W%C3%8C%C3%BA"
enc = urllib.parse.unquote(enc)
s_box = list(range(256))
j = 0

for i in range(256):
    j = (j + s_box[i] + ord(key[i % len(key)])) % 256
    s_box[i], s_box[j] = s_box[j], s_box[i]
res = []
i = j = 0

for s in enc:
    i = (i + 1) % 256
    j = (j + s_box[i]) % 256
    s_box[i], s_box[j] = s_box[j], s_box[i]
    t = (s_box[i] + s_box[j]) % 256
    k = s_box[t]
    res.append(chr(ord(s) ^ k))
cipher = "".join(res)
print(cipher) 
```

## 反思
实际上，我有一些问题：
·没有总体观念，没有从全局看出他实际上的变动只有a ^ b = c,只需要a = b ^ c即可。
·对python很不熟悉，因为没学过。

那也就只有多多写写题目多多积累的事情了















```



