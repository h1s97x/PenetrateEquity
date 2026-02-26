# GitHub Pages 部署指南

## 概述

本项目已配置自动部署到 GitHub Pages，使用 GitHub Actions 实现 CI/CD。

## 部署配置

### 1. Vite 配置

在 `vite.config.js` 中配置了 base 路径：

```javascript
base: process.env.NODE_ENV === 'production' ? '/PenetrateEquity/' : '/'
```

这确保了在 GitHub Pages 上正确加载资源。

### 2. GitHub Actions 工作流

工作流文件位于 `.github/workflows/deploy.yml`，包含两个主要任务：

#### Build 任务
- 检出代码
- 设置 Node.js 环境（v20）
- 安装依赖（npm ci）
- 构建项目（npm run build）
- 上传构建产物

#### Deploy 任务
- 部署到 GitHub Pages
- 依赖 Build 任务完成

### 3. 触发条件

自动部署会在以下情况触发：
- 推送代码到 `main` 分支
- 手动触发（workflow_dispatch）

## 首次设置步骤

### 1. 启用 GitHub Pages

1. 进入 GitHub 仓库页面
2. 点击 `Settings` > `Pages`
3. 在 `Source` 下选择 `GitHub Actions`

### 2. 推送代码

```bash
git add .
git commit -m "chore: 配置 GitHub Pages 部署和 CI/CD"
git push origin main
```

### 3. 查看部署状态

1. 进入仓库的 `Actions` 标签页
2. 查看 "Deploy to GitHub Pages" 工作流
3. 等待构建和部署完成（通常需要 2-3 分钟）

### 4. 访问网站

部署成功后，访问：
```
https://h1s97x.github.io/PenetrateEquity/
```

## 本地测试

### 开发模式
```bash
npm run dev
```

### 构建预览
```bash
npm run build
npm run preview
```

### 测试生产构建
```bash
NODE_ENV=production npm run build
```

## 目录结构

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 工作流
├── public/
│   └── .nojekyll              # 禁用 Jekyll 处理
├── dist/                       # 构建输出目录（自动生成）
├── src/                        # 源代码
└── vite.config.js             # Vite 配置（包含 base 路径）
```

## 常见问题

### 1. 页面显示 404

**原因**: base 路径配置不正确

**解决方案**: 
- 确保 `vite.config.js` 中的 base 路径与仓库名称一致
- 仓库名: `PenetrateEquity`
- Base 路径: `/PenetrateEquity/`

### 2. 资源加载失败

**原因**: 路由模式或资源路径问题

**解决方案**:
- 确保使用 hash 模式路由（`createWebHashHistory`）
- 或者配置 404.html 重定向

### 3. 部署失败

**原因**: 权限或配置问题

**解决方案**:
1. 检查 GitHub Actions 权限设置
2. 确保 Pages 设置为 "GitHub Actions" 源
3. 查看 Actions 日志获取详细错误信息

### 4. 构建成功但页面空白

**原因**: 路由配置问题

**解决方案**:
- 使用 hash 模式路由
- 或添加 404.html 处理 SPA 路由

## 更新部署

每次推送到 main 分支都会自动触发部署：

```bash
git add .
git commit -m "feat: 添加新功能"
git push origin main
```

## 手动触发部署

1. 进入 GitHub 仓库的 `Actions` 标签页
2. 选择 "Deploy to GitHub Pages" 工作流
3. 点击 `Run workflow` 按钮
4. 选择分支（main）
5. 点击 `Run workflow` 确认

## 性能优化建议

### 1. 启用 Gzip 压缩

GitHub Pages 自动启用 Gzip 压缩。

### 2. 代码分割

Vite 默认启用代码分割，无需额外配置。

### 3. 资源优化

- 图片使用 WebP 格式
- 启用懒加载
- 使用 CDN 加载大型库（可选）

## 监控和分析

### 查看部署历史

在 `Actions` 标签页可以查看所有部署历史和日志。

### 访问统计

可以使用 Google Analytics 或其他分析工具追踪访问数据。

## 回滚

如果需要回滚到之前的版本：

1. 找到之前成功的 commit
2. 创建新分支或直接 revert
3. 推送到 main 分支触发重新部署

```bash
git revert <commit-hash>
git push origin main
```

## 环境变量

如果需要使用环境变量：

1. 在 GitHub 仓库设置中添加 Secrets
2. 在 workflow 中引用：

```yaml
- name: Build
  run: npm run build
  env:
    VITE_API_KEY: ${{ secrets.API_KEY }}
```

## 自定义域名（可选）

1. 在仓库根目录创建 `CNAME` 文件
2. 添加你的域名
3. 在域名提供商处配置 DNS

```
# CNAME 文件内容
your-domain.com
```

## 总结

- ✅ 自动化部署已配置
- ✅ 推送到 main 分支自动触发
- ✅ 支持手动触发部署
- ✅ 构建产物自动上传到 GitHub Pages
- ✅ 访问地址: https://h1s97x.github.io/PenetrateEquity/

有任何问题请查看 GitHub Actions 日志或提交 Issue。
