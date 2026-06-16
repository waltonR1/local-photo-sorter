# Local Photo Sorter v0.1 项目需求文档

## 1. 项目名称

英文名称：

```text
Local Photo Sorter
```

中文名称：

```text
本地照片筛选器
```

------

## 2. 项目定位

Local Photo Sorter 是一个本地运行的照片筛选与分类网页工具，用于帮助用户快速整理项目素材图片。

第一版目标不是做完整相册管理软件，也不是 Lightroom 替代品，而是做一个轻量、实用、可真正使用的本地照片分类工具。

核心特点：

```text
本地运行
不上传照片
不需要后端
不需要账号
只支持 Chrome / Edge
使用 Vue 网页实现
```

------

## 3. 第一版技术栈

前端技术：

```text
Vue 3
TypeScript
Vite
Element Plus
Pinia
Vue Router
Dexie.js
File System Access API
```

包管理器：

```text
npm
```

开发系统：

```text
Windows 优先
```

数据存储：

```text
IndexedDB，通过 Dexie.js 操作
```

运行方式：

```text
本地启动 Vite 开发服务器
在 Chrome / Edge 中使用
```

第一版不做：

```text
后端服务
用户登录
云同步
Safari / Firefox 兼容
桌面应用打包
```

------

## 4. 目标用户

第一版主要给开发者本人使用。

不考虑多人协作、不考虑权限系统、不考虑公开部署后的复杂兼容问题。

------

## 5. 主要使用场景

主要用于：

```text
项目素材整理
```

典型使用方式：

```text
1. 选择一个本地工作目录
2. 程序创建固定文件夹结构
3. 用户导入图片，或手动复制图片到未分类目录
4. 在浏览模式查看图片
5. 创建分类
6. 在分类模式中快速将图片移动到对应分类
7. 不需要的图片移动到已废弃
8. 误操作可以撤销
```

------

## 6. 图片规模

第一版目标处理规模：

```text
几十张到几百张图片
```

设计上尽量保证可以处理：

```text
300 ~ 1000 张图片
```

如果未来需要处理几千张以上图片，再加入：

```text
虚拟滚动
缩略图持久缓存
分页扫描
更强的性能优化
```

------

## 7. 支持的图片格式

第一版支持：

```text
.jpg
.jpeg
.png
.webp
```

第一版暂不重点支持：

```text
.gif
.bmp
.heic
.raw
```

GIF、HEIC、RAW 等格式放到后续版本考虑。

------

## 8. 工作区初始化

用户第一次进入应用时，需要选择一个本地文件夹作为工作目录。

初始化时需要选择工作区语言：

```text
中文
English
```

工作区语言用于决定本地文件夹名称。

界面语言默认跟随初始化语言，但后续可以单独切换。

重要规则：

```text
界面语言可以切换
但已经创建的文件夹名称不自动修改
```

例如初始化时选择中文，则文件夹为：

```text
未分类
已分类
已废弃
```

后续即使界面语言改成英文，也不会自动改成本地目录：

```text
Unsorted
Sorted
Discarded
```

------

## 9. 中文工作区目录结构

如果初始化语言选择中文，则创建：

```text
目标文件夹/
├── 未分类/
├── 已分类/
└── 已废弃/
```

用户创建分类后，分类文件夹位于：

```text
目标文件夹/
├── 未分类/
├── 已分类/
│   ├── 分类1/
│   ├── 分类2/
│   └── 分类3/
└── 已废弃/
```

示例：

```text
目标文件夹/
├── 未分类/
├── 已分类/
│   ├── 产品图/
│   ├── 参考图/
│   └── 截图/
└── 已废弃/
```

------

## 10. 英文工作区目录结构

如果初始化语言选择 English，则创建：

```text
Workspace/
├── Unsorted/
├── Sorted/
└── Discarded/
```

用户创建分类后：

```text
Workspace/
├── Unsorted/
├── Sorted/
│   ├── Product/
│   ├── Reference/
│   └── Screenshot/
└── Discarded/
```

英文目录固定使用：

```text
Unsorted
Sorted
Discarded
```

不使用：

```text
Trash
```

原因是 `Discarded` 更符合“废弃但未彻底删除”的含义。

------

## 11. 初始化流程

初始化页面流程：

```text
1. 打开应用
2. 选择初始化语言：中文 / English
3. 点击“选择工作目录”
4. 浏览器弹出文件夹选择窗口
5. 用户选择本地目标文件夹
6. 程序检查该目录是否已经包含工作区结构
7. 如果没有，弹窗确认是否创建
8. 如果已有，弹窗确认是否继续使用
9. 初始化完成后进入浏览模式
```

如果目录中没有工作区结构，中文提示：

```text
检测到该目录还不是 Local Photo Sorter 工作区。

程序将创建以下文件夹：

未分类
已分类
已废弃

是否继续？
```

英文提示：

```text
This folder is not a Local Photo Sorter workspace yet.

The following folders will be created:

Unsorted
Sorted
Discarded

Continue?
```

------

## 12. 已有工作区处理

如果用户选择的目录已经包含工作区结构，则提示：

```text
检测到已有工作区，是否继续使用？
```

用户确认后，程序直接使用该目录。

第一版不做复杂校验，比如：

```text
部分目录缺失
目录名被手动修改
工作区结构混乱
```

这些情况可以提示用户重新初始化或手动修复。

------

## 13. 浏览模式

浏览模式是主页面，用于查看、选择、预览、移动、废弃、恢复图片。

页面布局：

```text
顶部工具栏
左侧导航栏
中间图片网格
右侧详情面板
```

整体结构：

```text
┌──────────────────────────────────────────────────────────────┐
│ 顶部工具栏                                                    │
│ [导入] [刷新] [新建分类] [进入分类模式] [撤销] [设置]          │
├───────────────┬───────────────────────────────┬──────────────┤
│ 左侧导航栏     │ 中间图片网格                    │ 右侧详情面板  │
│               │                               │              │
│ 全部照片       │ [图] [图] [图] [图]             │ 文件名        │
│ 未分类         │ [图] [图] [图] [图]             │ 路径          │
│ 分类           │ [图] [图] [图] [图]             │ 大小          │
│   分类1        │                               │ 修改时间      │
│   分类2        │                               │ 当前状态      │
│ 已废弃         │                               │ 操作按钮      │
└───────────────┴───────────────────────────────┴──────────────┘
```

------

## 14. 左侧导航栏

中文界面：

```text
全部照片
未分类
分类
  分类1
  分类2
  分类3
已废弃
```

英文界面：

```text
All Photos
Unsorted
Categories
  Category 1
  Category 2
  Category 3
Discarded
```

规则：

```text
全部照片 = 未分类 + 所有已分类图片
```

全部照片不包含：

```text
已废弃 / Discarded
```

已废弃单独显示。

------

## 15. 浏览模式图片操作

单击图片：

```text
选中图片
```

双击图片：

```text
打开大图预览
```

Ctrl 多选：

```text
选择多张不连续图片
```

Shift 多选：

```text
选择连续范围图片
```

右键图片时显示菜单：

```text
预览
重命名
移动到分类
移动到已废弃
```

如果当前位于已废弃页面，右键菜单为：

```text
预览
恢复到原位置
```

------

## 16. 多选操作

第一版支持多选。

多选后，右侧详情面板显示：

```text
已选择 N 张图片
```

普通图片多选时支持：

```text
批量移动到分类
批量移动到已废弃
取消选择
```

已废弃图片多选时支持：

```text
批量恢复到原位置
取消选择
```

第一版不做：

```text
批量重命名
批量导出
批量压缩
```

------

## 17. 图片网格

图片网格支持三种大小：

```text
小
中
大
```

设置项：

```text
gridSize: small | medium | large
```

图片排序支持：

```text
文件名排序
修改时间排序
```

排序方向支持：

```text
升序
降序
```

第一版支持文件名搜索。

搜索范围为当前左侧导航选中的区域。

例如：

```text
当前在“未分类”
搜索只搜索未分类图片
当前在“全部照片”
搜索未分类 + 已分类图片
```

------

## 18. 大图预览

双击图片后打开大图预览弹窗。

第一版支持：

```text
上一张
下一张
放大
缩小
移动到分类
移动到已废弃
```

第一版不做：

```text
旋转
裁剪
编辑
滤镜
EXIF 显示
```

大图预览示意：

```text
┌──────────────────────────────────────────┐
│ IMG_001.jpg                     [关闭]   │
├──────────────────────────────────────────┤
│                                          │
│                大图预览                  │
│                                          │
├──────────────────────────────────────────┤
│ [上一张] [下一张] [放大] [缩小]           │
│ [移动到分类] [移到已废弃]                │
└──────────────────────────────────────────┘
```

------

## 19. 分类模式

分类模式用于快速处理未分类图片。

分类模式只处理：

```text
未分类 / Unsorted
```

第一版不从已有分类中重新分类。

如果需要重新分类，可以在浏览模式中移动图片。

------

## 20. 分类模式初始状态

分类模式一开始可能没有任何用户分类。

如果还没有创建分类，分类模式页面显示：

```text
当前照片大图

暂无分类
请先创建分类

[+ 新分类] [跳过] [废弃]
```

此时用户不能按数字键分类，因为还没有分类可绑定。

用户点击：

```text
+ 新分类
```

创建分类后，系统自动将该分类加入分类列表。

------

## 21. 分类数量规则

第一版允许创建多个分类，不限制为 10 个。

但是分类快捷键只绑定前 10 个分类。

快捷键绑定规则：

```text
第 1 个分类：1
第 2 个分类：2
第 3 个分类：3
第 4 个分类：4
第 5 个分类：5
第 6 个分类：6
第 7 个分类：7
第 8 个分类：8
第 9 个分类：9
第 10 个分类：0
第 11 个及以后：无快捷键
```

第 11 个及之后的分类仍然可以使用，但需要通过点击、搜索或分类选择弹窗操作。

------

## 22. 分类模式页面结构

当已经有分类时，页面结构如下：

```text
┌──────────────────────────────────────────────────────────────┐
│ 顶部栏                                                       │
│ 未分类：12 / 356       [返回浏览] [撤销] [设置]               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                         当前照片大图                         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ 当前分类：分类1                                               │
│                                                              │
│ 快捷分类：                                                    │
│ [1 分类1] [2 分类2] [3 分类3] ... [0 分类10]                  │
│                                                              │
│ 更多分类：                                                    │
│ [选择其他分类] [+ 新分类]                                      │
│                                                              │
│ [Enter 放入当前分类] [Space 跳过] [Delete 废弃] [R 重命名]     │
└──────────────────────────────────────────────────────────────┘
```

如果分类数量小于等于 10 个，只显示快捷分类按钮。

如果分类数量超过 10 个，显示：

```text
快捷分类
选择其他分类
```

“选择其他分类”弹窗中可以搜索分类名称。

------

## 23. 当前分类快捷选择

分类模式支持“当前分类”。

用户可以通过点击分类按钮选择当前分类。

例如当前分类为：

```text
产品图
```

则：

```text
Enter = 放入产品图
```

用户也可以直接按数字键分类。

例如：

```text
1 = 放入第一个分类
2 = 放入第二个分类
3 = 放入第三个分类
```

数字键操作会直接分类并进入下一张，不需要先切换当前分类。

------

## 24. 分类模式快捷键

| 快捷键   | 功能                   |
| -------- | ---------------------- |
| 1        | 放入第 1 个分类        |
| 2        | 放入第 2 个分类        |
| 3        | 放入第 3 个分类        |
| 4        | 放入第 4 个分类        |
| 5        | 放入第 5 个分类        |
| 6        | 放入第 6 个分类        |
| 7        | 放入第 7 个分类        |
| 8        | 放入第 8 个分类        |
| 9        | 放入第 9 个分类        |
| 0        | 放入第 10 个分类       |
| Enter    | 放入当前分类           |
| Space    | 跳过当前照片           |
| Delete   | 移动到已废弃           |
| R        | 重命名当前照片         |
| N        | 新建分类               |
| Ctrl + Z | 撤销上一步             |
| Esc      | 返回浏览模式或关闭弹窗 |

注意：

```text
只有前 10 个分类拥有数字快捷键。
第 11 个及之后的分类没有快捷键。
```

------

## 25. 分类后行为

分类后自动进入下一张。

例如：

```text
当前照片：a.jpg
按 1
a.jpg 移动到第一个分类
自动显示 b.jpg
```

废弃后也自动进入下一张：

```text
当前照片：a.jpg
按 Delete
a.jpg 移动到已废弃
自动显示 b.jpg
```

跳过后也进入下一张：

```text
当前照片：a.jpg
按 Space
a.jpg 暂时跳过
自动显示 b.jpg
```

跳过的图片在本轮结束后可以重新处理。

结束提示：

```text
本轮分类完成。
还有 N 张跳过的照片，是否重新处理？
```

英文：

```text
Classification completed.
There are N skipped photos. Review them again?
```

------

## 26. 分类模式图片信息

分类模式默认保持干净，只显示当前图片和操作按钮。

图片信息采用可折叠面板显示。

可折叠信息包括：

```text
文件名
文件大小
修改时间
相对路径
```

第一版不显示 EXIF 信息。

------

## 27. 新建分类

用户可以在浏览模式或分类模式中新建分类。

新建分类时输入分类名称。

分类名称规则：

允许：

```text
中文
英文
数字
空格
下划线 _
短横线 -
```

禁止：

```text
/ \ : * ? " < > |
```

分类名不能：

```text
为空
全是空格
与已有分类重名
与系统目录重名
```

中文系统目录名：

```text
未分类
已分类
已废弃
```

英文系统目录名：

```text
Unsorted
Sorted
Discarded
```

------

## 28. 分类移动逻辑

当用户将图片移动到某个分类时，文件从未分类目录移动到对应分类目录。

中文示例：

```text
未分类/a.jpg
```

移动到分类“产品图”后：

```text
已分类/产品图/a.jpg
```

英文示例：

```text
Unsorted/a.jpg
```

移动到分类 `Product` 后：

```text
Sorted/Product/a.jpg
```

如果目标分类中存在同名文件，则自动重命名：

```text
a.jpg
a_1.jpg
a_2.jpg
```

------

## 29. 删除分类

第一版支持删除分类。

删除分类时，不会删除分类中的图片。

删除分类的流程：

```text
1. 将该分类文件夹中的所有图片移动回未分类目录
2. 如果未分类目录中存在同名文件，则自动重命名
3. 删除该分类文件夹
4. 从分类列表中移除该分类
5. 刷新图片列表
```

中文示例：

删除前：

```text
已分类/产品图/a.jpg
已分类/产品图/b.jpg
```

删除分类“产品图”后：

```text
未分类/a.jpg
未分类/b.jpg
```

然后删除空文件夹：

```text
已分类/产品图/
```

英文示例：

删除前：

```text
Sorted/Product/a.jpg
Sorted/Product/b.jpg
```

删除分类 `Product` 后：

```text
Unsorted/a.jpg
Unsorted/b.jpg
```

然后删除空文件夹：

```text
Sorted/Product/
```

------

## 30. 删除分类的同名处理

如果移动回未分类时遇到同名文件，使用自动重命名规则。

例如删除分类前：

```text
未分类/a.jpg
已分类/产品图/a.jpg
```

删除“产品图”后：

```text
未分类/a.jpg
未分类/a_1.jpg
```

如果还有重复：

```text
未分类/a_2.jpg
```

统一规则：

```text
a.jpg
a_1.jpg
a_2.jpg
```

------

## 31. 删除分类确认

删除分类属于较大操作，必须弹窗确认。

中文提示：

```text
确定要删除分类「产品图」吗？

该分类文件夹中的 12 张图片会移动回「未分类」。
图片不会被删除。
```

英文提示：

```text
Delete category "Product"?

The 12 photos in this category will be moved back to "Unsorted".
Photos will not be deleted.
```

按钮：

```text
取消
确认删除
```

------

## 32. 删除分类是否可撤销

第一版建议：

```text
删除分类不可通过 Ctrl + Z 撤销。
```

原因是删除分类涉及：

```text
批量移动图片
删除分类文件夹
恢复分类列表
恢复快捷键排序
```

复杂度高于普通移动操作。

但是由于图片不会被删除，而是移动回未分类，所以安全性仍然较高。

删除分类前必须明确提示：

```text
此操作不会删除图片，但分类删除后不可撤销。
```

英文：

```text
This will not delete photos, but deleting the category cannot be undone.
```

------

## 33. 已废弃逻辑

第一版的已废弃不是永久删除。

它只是把图片移动到：

```text
已废弃 / Discarded
```

第一版不做真正删除。

------

## 34. 已废弃保留原路径

废弃时保留图片原来的相对路径。

从未分类废弃：

```text
未分类/a.jpg
```

变成：

```text
已废弃/未分类/a.jpg
```

恢复后：

```text
未分类/a.jpg
```

从分类中废弃：

```text
已分类/产品图/a.jpg
```

变成：

```text
已废弃/已分类/产品图/a.jpg
```

恢复后：

```text
已分类/产品图/a.jpg
```

英文同理：

```text
Unsorted/a.jpg
```

变成：

```text
Discarded/Unsorted/a.jpg
```

恢复后：

```text
Unsorted/a.jpg
Sorted/Product/a.jpg
```

变成：

```text
Discarded/Sorted/Product/a.jpg
```

恢复后：

```text
Sorted/Product/a.jpg
```

------

## 35. 已废弃恢复

已废弃页面支持：

```text
单张恢复到原位置
批量恢复到原位置
```

如果恢复目标位置已经存在同名文件，则自动重命名。

例如恢复：

```text
已废弃/未分类/a.jpg
```

但：

```text
未分类/a.jpg
```

已经存在，则恢复为：

```text
未分类/a_1.jpg
```

------

## 36. 导入功能

第一版支持导入按钮。

导入方式：

```text
默认复制
高级选项允许移动
```

导入目标：

```text
未分类 / Unsorted
```

导入弹窗：

```text
导入照片

[选择照片]

导入方式：
● 复制到未分类，保留原文件
○ 移动到未分类，原位置不再保留

同名文件处理：
自动重命名

[取消] [开始导入]
```

英文：

```text
Import Photos

[Select Photos]

Import mode:
● Copy to Unsorted and keep original files
○ Move to Unsorted and remove from original location

Duplicate names:
Auto rename

[Cancel] [Start Import]
```

------

## 37. 同名文件处理

第一版统一使用自动重命名。

规则：

```text
IMG_001.jpg
IMG_001_1.jpg
IMG_001_2.jpg
IMG_001_3.jpg
```

适用于：

```text
导入
移动到分类
移动到已废弃
恢复
重命名
删除分类时移动回未分类
```

------

## 38. 重命名功能

第一版支持：

```text
浏览模式右键重命名
分类模式中重命名当前照片
```

第一版不做：

```text
批量重命名
自动命名规则
按分类自动编号
```

重命名规则：

```text
默认保留原扩展名
文件名不能包含非法字符
如果目标名称已存在，则自动重命名
```

示例：

原文件：

```text
IMG_001.jpg
```

用户输入：

```text
product_front
```

结果：

```text
product_front.jpg
```

------

## 39. 撤销功能

第一版必须支持撤销。

撤销范围：

```text
本次打开网页期间
```

关闭网页后，不保证还能撤销。

撤销支持连续多步。

快捷键：

```text
Ctrl + Z
```

第一版支持撤销：

```text
移动到分类
移动到已废弃
恢复
重命名
```

第一版暂不重点支持：

```text
导入撤销
删除分类撤销
```

------

## 40. 操作确认

移动到已废弃：

```text
单张废弃不确认，但可以撤销
批量废弃需要确认
```

批量废弃确认提示：

```text
确定要将选中的 N 张图片移动到已废弃吗？
```

英文：

```text
Move the selected N photos to Discarded?
```

删除分类：

```text
必须确认
```

------

## 41. 数据保存

第一版使用 IndexedDB 保存本地状态。

使用 Dexie.js 操作 IndexedDB。

保存内容包括：

```text
工作区信息
工作区语言
界面语言
分类列表缓存
设置项
最近使用的工作区句柄
网格大小
排序方式
默认导入方式
```

第一版不在目标文件夹中写入配置文件。

也就是说，第一版暂不创建：

```text
photo-sorter-data/config.json
```

后续版本可以再加入本地配置文件，方便迁移到其他电脑。

------

## 42. 主要数据结构

### 42.1 WorkspaceState

```ts
interface WorkspaceState {
  id: string;
  name: string;
  language: 'zh' | 'en';
  uiLanguage: 'zh' | 'en';
  createdAt: number;
  updatedAt: number;
}
```

------

### 42.2 FolderNames

```ts
interface FolderNames {
  unsorted: string;
  sorted: string;
  discarded: string;
}
```

中文：

```ts
{
  unsorted: '未分类',
  sorted: '已分类',
  discarded: '已废弃'
}
```

英文：

```ts
{
  unsorted: 'Unsorted',
  sorted: 'Sorted',
  discarded: 'Discarded'
}
```

------

### 42.3 Category

```ts
interface Category {
  id: string;
  name: string;
  relativePath: string;
  shortcutKey?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0';
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}
```

说明：

```text
前 10 个分类拥有 shortcutKey。
第 11 个及之后的分类 shortcutKey 为空。
```

示例：

```ts
{
  id: 'cat_001',
  name: '产品图',
  relativePath: '已分类/产品图',
  shortcutKey: '1',
  sortOrder: 1,
  createdAt: 1760000000000,
  updatedAt: 1760000000000
}
```

第 11 个分类示例：

```ts
{
  id: 'cat_011',
  name: 'UI参考',
  relativePath: '已分类/UI参考',
  shortcutKey: undefined,
  sortOrder: 11,
  createdAt: 1760000000000,
  updatedAt: 1760000000000
}
```

------

### 42.4 PhotoItem

```ts
interface PhotoItem {
  id: string;
  name: string;
  extension: string;
  relativePath: string;
  parentType: 'unsorted' | 'category' | 'discarded';
  categoryName?: string;
  size: number;
  lastModified: number;
  objectUrl?: string;
  selected?: boolean;
}
```

------

### 42.5 AppSettings

```ts
interface AppSettings {
  gridSize: 'small' | 'medium' | 'large';
  sortBy: 'name' | 'modifiedTime';
  sortOrder: 'asc' | 'desc';
  defaultImportMode: 'copy' | 'move';
  uiLanguage: 'zh' | 'en';
}
```

------

### 42.6 ActionRecord

```ts
type ActionRecord =
  | MoveAction
  | RenameAction
  | RestoreAction;
interface MoveAction {
  type: 'move';
  fromPath: string;
  toPath: string;
  timestamp: number;
}
interface RenameAction {
  type: 'rename';
  fromPath: string;
  toPath: string;
  timestamp: number;
}
interface RestoreAction {
  type: 'restore';
  fromPath: string;
  toPath: string;
  timestamp: number;
}
```

------

## 43. 页面路由

第一版包含四个页面：

```text
/setup
/browse
/classify
/settings
```

对应：

```text
初始化页面
浏览页面
分类页面
设置页面
```

路由规则：

```text
如果没有工作区，访问 /browse 自动跳转 /setup
如果已有工作区，打开应用默认进入 /browse
```

------

## 44. 项目目录结构

推荐项目结构：

```text
local-photo-sorter/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.vue
│   │   │   ├── SidebarNav.vue
│   │   │   └── RightPanel.vue
│   │   ├── photo/
│   │   │   ├── PhotoGrid.vue
│   │   │   ├── PhotoCard.vue
│   │   │   ├── PhotoPreviewDialog.vue
│   │   │   └── PhotoDetailPanel.vue
│   │   ├── category/
│   │   │   ├── CategoryList.vue
│   │   │   ├── CategoryCreateDialog.vue
│   │   │   ├── CategorySelectDialog.vue
│   │   │   └── CategoryDeleteDialog.vue
│   │   └── import/
│   │       └── ImportDialog.vue
│   ├── views/
│   │   ├── SetupView.vue
│   │   ├── BrowseView.vue
│   │   ├── ClassifyView.vue
│   │   └── SettingsView.vue
│   ├── stores/
│   │   ├── workspaceStore.ts
│   │   ├── photoStore.ts
│   │   ├── categoryStore.ts
│   │   ├── settingsStore.ts
│   │   └── historyStore.ts
│   ├── services/
│   │   ├── fileSystemService.ts
│   │   ├── workspaceService.ts
│   │   ├── photoScanService.ts
│   │   ├── importService.ts
│   │   ├── categoryService.ts
│   │   ├── trashService.ts
│   │   ├── renameService.ts
│   │   └── thumbnailService.ts
│   ├── db/
│   │   └── indexedDb.ts
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── zh.ts
│   │   └── en.ts
│   ├── types/
│   │   ├── photo.ts
│   │   ├── category.ts
│   │   ├── workspace.ts
│   │   └── action.ts
│   ├── utils/
│   │   ├── fileName.ts
│   │   ├── path.ts
│   │   ├── image.ts
│   │   └── validation.ts
│   ├── router/
│   │   └── index.ts
│   ├── App.vue
│   └── main.ts
├── package.json
├── vite.config.ts
└── tsconfig.json
```

------

## 45. 核心服务职责

### 45.1 fileSystemService.ts

负责浏览器文件系统操作：

```text
选择目录
创建目录
读取目录
读取文件
写入文件
复制文件
移动文件
重命名文件
检查文件是否存在
删除空文件夹
```

------

### 45.2 workspaceService.ts

负责工作区初始化：

```text
检查工作区
创建工作区目录
获取系统目录名
恢复上次工作区
```

------

### 45.3 photoScanService.ts

负责扫描图片：

```text
扫描全部图片
扫描未分类图片
扫描分类图片
扫描已废弃图片
过滤支持格式
生成 PhotoItem
```

------

### 45.4 importService.ts

负责导入：

```text
选择导入文件
复制到未分类
移动到未分类
处理同名文件
```

------

### 45.5 categoryService.ts

负责分类：

```text
创建分类
删除分类
校验分类名
自动分配快捷键
清理快捷键
移动图片到分类
将分类中的图片移动回未分类
获取分类列表
重新排序分类
```

快捷键逻辑：

```text
分类排序前 10 个：
1,2,3,4,5,6,7,8,9,0

第 11 个及以后：
无快捷键
```

------

### 45.6 trashService.ts

负责废弃和恢复：

```text
移动到已废弃
构建废弃路径
恢复到原位置
批量恢复
```

------

### 45.7 renameService.ts

负责重命名：

```text
校验文件名
保留扩展名
处理同名文件
执行重命名
```

------

### 45.8 historyStore.ts

负责撤销：

```text
记录操作
撤销上一步
连续撤销
清空历史
```

------

## 46. 开发阶段

### 阶段 1：项目初始化

目标：

```text
项目能运行
基础页面能切换
Element Plus / Pinia / Router / Dexie 可用
```

任务：

```text
1. 创建 Vite + Vue + TypeScript 项目
2. 安装 Element Plus
3. 安装 Pinia
4. 安装 Vue Router
5. 安装 Dexie.js
6. 创建四个页面
7. 建立基础布局
```

------

### 阶段 2：工作区初始化

目标：

```text
可以选择本地文件夹并创建工作区目录
```

任务：

```text
1. 实现选择目录
2. 选择初始化语言
3. 生成中文或英文目录名
4. 检查目录是否已有工作区
5. 弹窗确认创建
6. 创建 未分类 / 已分类 / 已废弃
7. 保存工作区状态
```

------

### 阶段 3：扫描和浏览

目标：

```text
可以扫描未分类和分类中的图片并显示网格
```

任务：

```text
1. 扫描未分类目录
2. 扫描已分类目录
3. 扫描已废弃目录
4. 过滤 jpg / jpeg / png / webp
5. 生成图片 objectUrl
6. 显示图片网格
7. 支持小 / 中 / 大网格
8. 支持文件名排序
9. 支持修改时间排序
10. 支持文件名搜索
```

------

### 阶段 4：分类管理

目标：

```text
可以创建、删除分类，并移动图片
```

任务：

```text
1. 新建分类弹窗
2. 分类名校验
3. 创建分类文件夹
4. 支持多个分类
5. 前 10 个分类自动绑定快捷键 1-9 和 0
6. 第 11 个及之后分类不绑定快捷键
7. 单张移动到分类
8. 多选移动到分类
9. 删除分类前确认
10. 删除分类时将图片移动回未分类
11. 删除分类文件夹
```

------

### 阶段 5：废弃和恢复

目标：

```text
可以将图片移动到已废弃，并恢复到原位置
```

任务：

```text
1. 单张移动到已废弃
2. 批量移动到已废弃
3. 废弃时保留原路径结构
4. 已废弃页面显示图片
5. 单张恢复到原位置
6. 批量恢复到原位置
```

------

### 阶段 6：分类模式

目标：

```text
可以快速处理未分类图片
```

任务：

```text
1. 进入分类模式
2. 读取未分类图片列表
3. 如果没有分类，显示新建分类提示
4. 创建分类后自动显示分类按钮
5. 支持数字键 1-9 和 0 分类
6. 支持第 11 个及之后分类通过弹窗选择
7. 支持 Enter 放入当前分类
8. 支持 Space 跳过
9. 支持 Delete 废弃
10. 支持 R 重命名
11. 支持 N 新建分类
12. 分类后自动下一张
13. 显示进度
14. 处理跳过队列
```

------

### 阶段 7：导入功能

目标：

```text
可以从任意位置导入图片到未分类
```

任务：

```text
1. 导入弹窗
2. 选择图片文件
3. 默认复制导入
4. 高级选项允许移动导入
5. 同名文件自动重命名
6. 导入完成后刷新列表
```

------

### 阶段 8：预览、重命名、撤销

目标：

```text
完善使用体验
```

任务：

```text
1. 双击大图预览
2. 预览中上一张 / 下一张
3. 预览中放大 / 缩小
4. 浏览模式右键重命名
5. 分类模式重命名当前照片
6. 记录移动操作
7. 记录废弃操作
8. 记录恢复操作
9. 记录重命名操作
10. 支持 Ctrl + Z 撤销
```

------

### 阶段 9：设置和界面完善

目标：

```text
让第一版更舒服可用
```

任务：

```text
1. 设置界面语言
2. 设置网格大小
3. 设置排序方式
4. 设置默认导入方式
5. 保存设置到 IndexedDB
6. 优化空状态
7. 优化错误提示
8. 优化加载状态
```

------

## 47. v0.1 完成标准

当以下流程可以完整跑通时，v0.1 视为完成：

```text
1. 打开网页
2. 选择中文或英文初始化
3. 选择本地工作目录
4. 自动创建工作区文件夹
5. 导入或手动复制图片到未分类
6. 点击刷新后可以看到图片
7. 可以创建多个分类
8. 前 10 个分类自动绑定快捷键
9. 第 11 个及之后分类可以通过弹窗选择
10. 可以删除分类
11. 删除分类时图片移动回未分类
12. 可以在浏览模式中多选图片并移动到分类
13. 可以把图片移动到已废弃
14. 已废弃图片可以恢复到原位置
15. 可以进入分类模式
16. 分类模式没有分类时提示新建分类
17. 新建分类后自动加入分类列表
18. 可以通过 1-9 和 0 快速分类前 10 个分类
19. 可以通过 Delete 废弃
20. 可以通过 Space 跳过
21. 可以通过 Ctrl + Z 撤销本次会话内的普通操作
22. 可以搜索文件名
23. 可以按文件名或修改时间排序
24. 可以双击预览大图
```

------

## 48. v0.2 可考虑功能

v0.1 完成后，再考虑：

```text
持久化撤销历史
缩略图缓存
多级分类
多标签系统
分类拖拽排序
手动调整快捷键绑定
EXIF 拍摄时间
HEIC 支持
GIF 预览优化
批量重命名
自动命名规则
配置文件写入工作目录
Tauri 桌面版
```

------

## 49. 第一版开发原则

第一版开发原则：

```text
先能用，再好看
先简单，再扩展
先本地，再考虑桌面版
先单分类，再考虑多标签
先处理几百张，再优化几千张
```

不追求一次做完所有功能。

v0.1 的核心目标是：

```text
真正能够帮助用户整理项目素材图片。
```