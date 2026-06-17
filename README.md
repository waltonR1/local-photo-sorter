# Local Photo Sorter

本地照片筛选器。一个基于 Vue 3 的本地网页工具，用于快速整理、筛选和分类本地图片。

Local Photo Sorter runs locally in the browser. It helps you import, browse, classify, discard, restore, rename, and quickly sort photos without uploading them to any server.

------

## 1. 项目简介

Local Photo Sorter 是一个面向本地文件夹的照片整理工具。

它的核心思路是：用户选择一个本地工作目录，程序在该目录下创建固定的工作区结构，然后通过网页界面对图片进行分类、废弃、恢复、重命名和快速筛选。

第一版主要面向个人使用，适合整理项目素材、参考图、截图、产品图等本地图片资源。

------

## 2. 核心特性

目前已实现：

- 选择本地工作目录
- 初始化中文 / 英文工作区结构
- 自动创建：
  - `未分类 / Unsorted`
  - `已分类 / Sorted`
  - `已废弃 / Discarded`
- 自动恢复上次工作区记录
- 工作区权限失效时自动回到初始化页面
- 扫描本地图片
- 支持图片网格浏览
- 支持文件名搜索
- 支持文件名 / 修改时间排序
- 支持小 / 中 / 大网格大小
- 支持创建分类
- 支持删除分类
  - 删除分类时，分类中的图片会移动回未分类
  - 不会删除图片
- 支持单张 / 多张图片移动到分类
- 支持已分类图片移回未分类
- 支持单张 / 多张图片移动到已废弃
- 支持已废弃图片恢复到原位置
- 恢复已废弃图片后，会自动清理已废弃目录中的空文件夹
- 支持导入图片到未分类
- 支持同名文件自动重命名
- 支持浏览模式多选
  - 单击单选
  - Ctrl / Command + 单击多选
  - Shift + 单击范围选择
- 支持分类模式快速处理未分类图片
  - 默认情况下，数字键 `1-9` 和 `0` 对应前 10 个分类
  - 支持在设置页自定义分类快捷键绑定
  - `Enter` 放入当前分类
  - `Space` 跳过
  - `Delete` 移动到已废弃
  - `N` 新建分类
  - `R` 重命名
- 支持重命名图片
- 支持大图预览
- 支持撤销本次会话内的普通操作
- 支持设置页
  - 界面语言
  - 网格大小
  - 排序方式
  - 排序方向
  - 默认导入方式
  - 分类模式快捷键绑定
- 支持重新选择工作区

------

## 3. 技术栈

项目使用：

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Element Plus
- Dexie.js
- IndexedDB
- File System Access API

包管理器：

```bash
npm
```

------

## 4. 运行环境

目前第一版只计划支持：

- Chrome
- Microsoft Edge

不保证支持：

- Firefox
- Safari
- 移动端浏览器

原因是项目依赖浏览器的本地文件系统访问能力。

------

## 5. 本地运行

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

浏览器打开终端显示的地址，例如：

```text
http://localhost:5173/
```

构建生产版本：

```bash
npm run build
```

本地预览构建结果：

```bash
npm run preview
```

------

## 6. 使用方式

### 6.1 初始化工作区

第一次打开项目后，进入初始化页面。

用户需要选择：

- 工作区语言：
  - 中文
  - English
- 本地目标文件夹

如果选择中文，程序会创建：

```text
目标文件夹/
├── 未分类/
├── 已分类/
└── 已废弃/
```

如果选择 English，程序会创建：

```text
Workspace/
├── Unsorted/
├── Sorted/
└── Discarded/
```

工作区语言决定本地文件夹名称。

界面语言之后可以在设置页修改，但不会自动修改已经创建的本地文件夹名称。

### 6.2 工作区恢复

项目会在浏览器本地保存当前工作区记录。

再次打开项目时：

- 如果仍有工作区访问权限，会自动进入浏览页。
- 如果权限失效，会跳转回初始化页面，让用户重新选择工作区。
- 不会主动弹出权限请求导致白屏。

------

## 7. 浏览模式

浏览模式是主页面。

左侧导航包括：

```text
全部照片
未分类
分类
  分类1
  分类2
  分类3
已废弃

```

其中：

```text
全部照片 = 未分类 + 所有已分类图片

```

不包含已废弃图片。

浏览页布局：

- 左侧导航固定
- 右侧详情面板固定
- 中间照片区域独立滚动

在浏览模式中可以：

- 查看图片网格
- 搜索文件名
- 按文件名排序
- 按修改时间排序
- 切换网格大小
- 选中单张图片查看详情
- 多选图片进行批量操作
- 双击打开大图预览
- 移动图片到分类
- 将已分类图片移回未分类
- 移动图片到已废弃
- 从已废弃恢复图片
- 重命名图片
- 删除分类
- 重新选择工作区

------

## 8. 分类模式

分类模式用于快速处理未分类图片。

分类模式只处理：

```text
未分类 / Unsorted
```

默认快捷键规则：

```text
1 = 第 1 个分类
2 = 第 2 个分类
3 = 第 3 个分类
4 = 第 4 个分类
5 = 第 5 个分类
6 = 第 6 个分类
7 = 第 7 个分类
8 = 第 8 个分类
9 = 第 9 个分类
0 = 第 10 个分类
```

用户可以在设置页修改分类模式快捷键绑定。

规则说明：

- 未手动设置时，默认按 `1,2,3,4,5,6,7,8,9,0` 绑定前 10 个分类。
- 超过 10 个分类后，新分类不会自动顶替已有绑定。
- 没有绑定快捷键的分类仍然可以通过“选择其他分类”使用。
- 设置页修改快捷键后，分类模式会读取同一份绑定结果。

其他快捷键：

| 快捷键     | 功能           |
| ---------- | -------------- |
| `Enter`    | 放入当前分类   |
| `Space`    | 跳过当前图片   |
| `Delete`   | 移动到已废弃   |
| `N`        | 新建分类       |
| `R`        | 重命名当前图片 |
| `Ctrl + Z` | 撤销上一步     |
| `Esc`      | 返回浏览模式   |

------

## 9. 图片格式支持

当前支持：

```text
.jpg
.jpeg
.png
.webp
```

暂不重点支持：

```text
.gif
.bmp
.heic
.raw
```

------

## 10. 文件夹设计

### 中文工作区

```text
目标文件夹/
├── 未分类/
├── 已分类/
│   ├── 分类1/
│   ├── 分类2/
│   └── 分类3/
└── 已废弃/
```

### 英文工作区

```text
Workspace/
├── Unsorted/
├── Sorted/
│   ├── Category1/
│   ├── Category2/
│   └── Category3/
└── Discarded/
```

------

## 11. 分类逻辑

### 11.1 新建分类

分类会创建在：

```text
已分类/分类名/
```

或：

```text
Sorted/CategoryName/
```

分类名不能：

- 为空
- 与已有分类重名
- 与系统目录重名
- 包含非法文件名字符，例如 `/ \ : * ? " < > |`

### 11.2 删除分类

删除分类时不会删除图片。

删除分类的流程：

```text
1. 将该分类中的所有图片移动回未分类
2. 如果未分类中已有同名文件，则自动重命名
3. 删除空的分类文件夹
4. 刷新分类列表和图片列表
```

例如：

```text
已分类/产品图/a.jpg
已分类/产品图/b.jpg
```

删除分类“产品图”后：

```text
未分类/a.jpg
未分类/b.jpg
```

注意：

```text
删除分类本身暂不支持 Ctrl + Z 撤销。
```

但图片不会丢失，只会回到未分类。

### 11.3 移回未分类

已分类图片可以移回未分类。

例如：

```text
已分类/产品图/a.jpg
```

可以移动回：

```text
未分类/a.jpg
```

该操作会写入撤销历史，因此可以通过 `Ctrl + Z` 撤销。

------

## 12. 已废弃逻辑

已废弃不是永久删除。

图片移动到已废弃后，会保留原来的相对路径。

例如，从未分类废弃：

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

英文工作区同理：

```text
Unsorted/a.jpg
```

变成：

```text
Discarded/Unsorted/a.jpg
```

```text
Sorted/Product/a.jpg
```

变成：

```text
Discarded/Sorted/Product/a.jpg
```

恢复已废弃图片后，如果 `已废弃 / Discarded` 下产生空的来源目录，程序会自动向上清理这些空目录，但不会删除 `已废弃 / Discarded` 根目录本身。

------

## 13. 同名文件处理

当移动、恢复、导入或重命名时，如果目标位置已有同名文件，会自动重命名。

规则：

```text
a.jpg
a_1.jpg
a_2.jpg
a_3.jpg
```

适用于：

- 导入
- 移动到分类
- 移回未分类
- 移动到已废弃
- 从已废弃恢复
- 删除分类时移动回未分类
- 重命名

------

## 14. 撤销逻辑

当前版本支持本次网页打开期间的撤销。

支持撤销：

- 移动到分类
- 移回未分类
- 移动到已废弃
- 从已废弃恢复
- 重命名

暂不重点支持撤销：

- 导入
- 删除分类
- 重新选择工作区

快捷键：

```text
Ctrl + Z
```

注意：

```text
刷新页面后，撤销历史不会保留。
```

------

## 15. 导入功能

当前版本支持复制导入。

导入时，图片会被复制到：

```text
未分类 / Unsorted
```

原文件会保留。

设置页中可以看到“默认导入方式”，但当前网页版本优先支持复制导入。

移动导入由于浏览器权限限制，后续再单独完善。

------

## 16. 设置页

设置页支持：

- 界面语言
- 网格大小
- 默认排序字段
- 排序方向
- 默认导入方式
- 分类模式快捷键绑定
- 重新选择工作区

设置保存到 IndexedDB。

设置保存时会转换成纯 JSON 数据，避免响应式对象或复杂对象导致 IndexedDB `DataCloneError`。

刷新设置页时，如果存在可用工作区，会自动扫描照片和分类列表，确保快捷键绑定区域可以正常显示分类。

------

## 17. 数据保存

项目使用 IndexedDB 保存本地状态。

通过 Dexie.js 管理数据。

目前保存：

- 当前工作区记录
- 工作区语言
- 界面语言
- 设置项
- 网格大小
- 排序方式
- 默认导入方式
- 分类模式快捷键绑定

不保存到云端，不上传图片。

------

## 18. 项目目录结构

当前结构大致如下：

```text
local-photo-sorter/
├── CHANGELOG.md
├── README.md
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
└── src/
    ├── assets/
    │   ├── main.css
    ├── components/
    │   ├── category/
    │   │   ├── CategoryCreateDialog.vue
    │   │   ├── CategorySelectDialog.vue
    │   │   └── ClassifyActionPanel.vue
    │   ├── import/
    │   │   └── ImportDialog.vue
    │   ├── layout/
    │   │   ├── BrowseToolbar.vue
    │   │   └── SidebarNav.vue
    │   └── photo/
    │       ├── PhotoCard.vue
    │       ├── PhotoDetailPanel.vue
    │       ├── PhotoGrid.vue
    │       ├── PhotoPreviewDialog.vue
    │       └── PhotoRenameDialog.vue
    ├── composables/
    │   ├── useBrowsePhotoActions.ts
    │   ├── useClassifyQueue.ts
    │   ├── useClassifyShortcuts.ts
    │   ├── usePhotoPreview.ts
    │   └── usePhotoSelection.ts
    ├── db/
    │   └── indexedDb.ts
    ├── router/
    │   └── index.ts
    ├── services/
    │   ├── categoryService.ts
    │   ├── fileSystemService.ts
    │   ├── importService.ts
    │   ├── photoScanService.ts
    │   ├── renameService.ts
    │   ├── trashService.ts
    │   └── workspaceService.ts
    ├── stores/
    │   ├── historyStore.ts
    │   ├── photoStore.ts
    │   ├── settingsStore.ts
    │   └── workspaceStore.ts
    ├── types/
    │   ├── action.ts
    │   ├── category.ts
    │   ├── file-system-access.d.ts
    │   ├── photo.ts
    │   ├── settings.ts
    │   └── workspace.ts
    ├── utils/
    │   ├── classifyShortcuts.ts
    │   ├── fileName.ts
    │   ├── folderNames.ts
    │   ├── image.ts
    │   └── path.ts
    ├── views/
    │   ├── BrowseView.vue
    │   ├── ClassifyView.vue
    │   ├── SettingsView.vue
    │   └── SetupView.vue
    ├── App.vue
    └── main.ts
```

------

## 19. 当前限制

当前版本仍有一些限制：

- 只支持 Chrome / Edge
- 不支持 Safari / Firefox
- 不支持移动端浏览器
- 不支持 HEIC / RAW
- 没有 AI 自动分类
- 没有人脸识别
- 没有多级分类
- 没有多标签系统
- 没有缩略图持久缓存
- 没有云同步
- 没有用户账号
- 没有桌面应用打包
- 删除分类暂不支持撤销
- 刷新页面后撤销历史不会保留
- 移动导入暂未开放

------

## 20. 后续计划

v0.2 可考虑：

- 缩略图缓存，提升大量图片浏览性能
- 虚拟滚动或更细粒度懒加载
- 持久化撤销历史
- 多级分类
- 多标签系统
- 分类拖拽排序
- 更完整的快捷键管理
- EXIF 拍摄时间排序
- HEIC 支持
- GIF 预览优化
- 批量重命名
- 自动命名规则
- 配置文件写入工作目录
- Tauri 桌面版
- 暗色模式
- 更完整的中英文界面切换

------

## 21. 开发原则

本项目第一版遵循：

```text
先能用，再好看
先简单，再扩展
先本地，再桌面
先单分类，再多标签
先处理几百张，再优化几千张
```

v0.1 的目标是：

```text
真正能够帮助用户整理项目素材图片。
```

------

## 22. 安全说明

Local Photo Sorter 的设计目标是本地优先。

当前版本：

- 不上传图片
- 不连接后端服务
- 不需要登录
- 不保存图片到云端
- 只在用户授权的本地文件夹内操作

用户应注意：

- 操作真实本地文件前，建议先用测试文件夹试用
- 虽然“已废弃”不是删除，但移动文件仍然会改变本地目录结构
- 重要照片建议保留备份

------

## 23. 更新日志

版本变化请查看：

```text
CHANGELOG.md
```