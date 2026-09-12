# 收好 · Little Order

一个可以直接在浏览器里玩的 3D 收纳解压小游戏。乳白色旋转柜、咖色透明抽屉门，以及一桌等着被收好的日常物品。

## 玩法

- 点击抽屉打开，再点击桌面上的物品放入，自动按同类整齐排列。
- 四个面共 48 个抽屉，每个最多收纳 16 件；满了可换一个抽屉继续。
- 点击抽屉内的物品可以扔回桌面，支持撤回和重新开始。
- 用左右旋转按钮或横向拖动柜体，切换收纳面。
- 支持开合抽屉、放置物品的拟音，可随时静音。
- 进度保存在当前浏览器，无需注册或登录。手机和电脑均可玩。

共 156 件物品：牛奶、汽水、苹果、橘子、酸奶和鸡蛋。使用 Three.js 和 Blender 制作，音效在本地合成。

## 本地运行

需要 Node.js 22.12+，或兼容的更新版本。

```sh
npm ci
npm run dev
```

## 验证与构建

```sh
npm test
npm run build
npm run preview
```

`npm test` 检查物品尺寸、隔板碰撞、开合布局和全部 48 个抽屉。`npm run test:e2e` 运行浏览器测试，需要本机安装 Google Chrome。

## 部署

在 Vercel 导入此 GitHub 仓库即可。框架选择 Vite，构建命令为 `npm run build`，输出目录为 `dist`；配置已包含在 `vercel.json` 中。也可将构建后的 `dist` 上传到其他静态网站托管平台。

本项目不需要服务器、数据库或环境变量。

## 项目结构

- `src/studio.js`：交互状态、按钮、进度保存。
- `src/studio-scene.js`：3D 场景、动画和物品点选。
- `src/storage-layout.js`：抽屉容量与物品排列。
- `src/cabinet-design.js`：柜体和透明门板材质。
- `src/foley.js`：物品与抽屉拟音。
- `public/models/`：游戏使用的 GLB 模型。
- `blender/`：可复现的建模脚本与抽屉源文件。

重新生成模型时，用 Blender 4.5 依次运行：

```sh
blender --background --python blender/build_assets.py
blender --background --python blender/build_pantry_drawer.py
```

网站仅发布当前收纳游戏；历史演示页面和本地其他项目不属于此仓库。
