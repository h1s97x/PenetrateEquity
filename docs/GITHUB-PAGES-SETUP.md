# GitHub Pages 快速设置指南

## 📋 前置条件

- ✅ GitHub 账号
- ✅ 代码已推送到 GitHub 仓库
- ✅ 仓库名称: `PenetrateEquity`

## 🚀 一键部署步骤

### 1. 推送代码到 GitHub

```bash
git push origin main
```

### 2. 启用 GitHub Pages

1. 打开仓库页面: https://github.com/h1s97x/PenetrateEquity
2. 点击 `Settings` 标签
3. 在左侧菜单找到 `Pages`
4. 在 `Source` 部分选择 `GitHub Actions`
5. 保存设置

### 3. 等待自动部署

- 推送代码后会自动触发部署
- 查看部署进度: https://github.com/h1s97x/PenetrateEquity/actions
- 首次部署大约需要 2-3 分钟

### 4. 访问网站

部署成功后访问:
```
https://h1s97x.github.io/PenetrateEquity/
```

## 🎯 配置说明

### 已完成的配置

✅ **GitHub Actions 工作流** (`.github/workflows/deploy.yml`)
- 自动构建
- 自动部署
- 支持手动触发

✅ **Vite 配置** (`vite.config.js`)
```javascript
base: process.env.NODE_ENV === 'production' ? '/PenetrateEquity/' : '/'
```

✅ **路由配置** (`src/router/index.js`)
- 使用 hash 模式 (`createWebHashHistory`)
- 兼容 GitHub Pages

✅ **Jekyll 禁用** (`public/.nojekyll`)
- 确保正确处理下划线开头的文件

## 📊 部署流程

```mermaid
graph LR
    A[推送代码] --> B[触发 GitHub Actions]
    B --> C[安装依赖]
    C --> D[构建项目]
    D --> E[上传构建产物]
    E --> F[部署到 GitHub Pages]
    F --> G[网站上线]
```

## 🔄 更新部署

每次推送到 main 分支都会自动部署：

```bash
# 修改代码
git add .
git commit -m "feat: 添加新功能"
git push origin main

# 自动触发部署，无需手动操作
```

## 🎮 手动触发部署

如果需要手动触发部署：

1. 访问 Actions 页面: https://github.com/h1s97x/PenetrateEquity/actions
2. 选择 "Deploy to GitHub Pages" 工作流
3. 点击 `Run workflow` 按钮
4. 选择 `main` 分支
5. 点击绿色的 `Run workflow` 按钮

## 📈 监控部署状态

### 查看部署历史

访问: https://github.com/h1s97x/PenetrateEquity/actions

### 部署状态徽章

在 README.md 中已添加：

```markdown
[![Deploy to GitHub Pages](https://github.com/h1s97x/PenetrateEquity/actions/workflows/deploy.yml/badge.svg)](https://github.com/h1s97x/PenetrateEquity/actions/workflows/deploy.yml)
```

显示效果：
- ✅ 绿色 = 部署成功
- ❌ 红色 = 部署失败
- 🟡 黄色 = 部署中

## 🐛 常见问题

### 问题 1: 页面显示 404

**原因**: GitHub Pages 设置未启用

**解决方案**:
1. 进入 Settings > Pages
2. Source 选择 "GitHub Actions"
3. 等待几分钟后刷新

### 问题 2: 资源加载失败

**原因**: base 路径配置错误

**解决方案**:
检查 `vite.config.js` 中的 base 路径是否与仓库名一致：
```javascript
base: '/PenetrateEquity/'  // 必须与仓库名一致
```

### 问题 3: 路由跳转 404

**原因**: 使用了 history 模式

**解决方案**:
已配置为 hash 模式，URL 会包含 `#`：
```
https://h1s97x.github.io/PenetrateEquity/#/chart
```

### 问题 4: 部署失败

**检查步骤**:
1. 查看 Actions 日志找到错误信息
2. 确认 `package.json` 中的依赖完整
3. 确认构建命令 `npm run build` 本地可以成功
4. 检查 Node.js 版本（工作流使用 v20）

## 🔧 本地测试

在推送前本地测试生产构建：

```bash
# 构建生产版本
NODE_ENV=production npm run build

# 预览构建结果
npm run preview

# 访问 http://localhost:4173
```

## 📝 工作流配置详解

### 触发条件

```yaml
on:
  push:
    branches:
      - main          # 推送到 main 分支触发
  workflow_dispatch:  # 支持手动触发
```

### 构建步骤

1. **Checkout**: 检出代码
2. **Setup Node**: 安装 Node.js v20
3. **Install**: 安装依赖 (`npm ci`)
4. **Build**: 构建项目 (`npm run build`)
5. **Upload**: 上传构建产物
6. **Deploy**: 部署到 GitHub Pages

### 权限配置

```yaml
permissions:
  contents: read    # 读取仓库内容
  pages: write      # 写入 Pages
  id-token: write   # 写入 ID token
```

## 🎨 自定义配置

### 修改部署分支

如果想从其他分支部署，修改 `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches:
      - develop  # 改为你的分支名
```

### 添加构建环境变量

在工作流中添加环境变量：

```yaml
- name: Build
  run: npm run build
  env:
    NODE_ENV: production
    VITE_API_URL: ${{ secrets.API_URL }}
```

然后在 GitHub 仓库设置中添加 Secret。

## 📚 相关文档

- [完整部署文档](./DEPLOYMENT.md)
- [GitHub Pages 官方文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)

## ✅ 检查清单

部署前确认：

- [ ] 代码已推送到 GitHub
- [ ] GitHub Pages 已启用（Source: GitHub Actions）
- [ ] `vite.config.js` 中 base 路径正确
- [ ] 路由使用 hash 模式
- [ ] 本地构建测试通过
- [ ] `.nojekyll` 文件存在

## 🎉 完成

如果一切顺利，你的网站现在应该已经在线了！

访问: https://h1s97x.github.io/PenetrateEquity/

有问题？查看 [完整部署文档](./DEPLOYMENT.md) 或提交 Issue。
