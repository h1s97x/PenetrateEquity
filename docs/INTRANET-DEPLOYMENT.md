# 内网环境部署指南

## 概述

本文档提供了将股权穿透图可视化系统部署到内网环境的完整步骤。

## 前置要求

### 开发环境
- Node.js >= 16.x
- npm >= 8.x 或 yarn >= 1.22.x

### 内网服务器
- 支持静态文件托管的 Web 服务器（Nginx、Apache、IIS 等）
- 或者 Node.js 运行环境（用于运行开发服务器）

## 部署方式

### 方式一：生产构建部署（推荐）

这是最常用的部署方式，将项目构建为静态文件后部署到 Web 服务器。

#### 1. 在开发机器上构建项目

```bash
# 安装依赖
npm install

# 生产构建
npm run build
```

构建完成后，会在项目根目录生成 `dist` 文件夹，包含所有静态文件。

#### 2. 配置构建路径（如果需要）

如果你的应用不是部署在域名根路径，需要修改 `vite.config.js`：

```javascript
export default defineConfig({
  base: '/equity-chart/', // 修改为你的部署路径
  // ... 其他配置
})
```

然后重新构建：

```bash
npm run build
```

#### 3. 将 dist 文件夹部署到内网服务器

##### 使用 Nginx

1. 将 `dist` 文件夹复制到服务器（例如 `/var/www/equity-chart`）

2. 配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-intranet-domain.com;  # 修改为你的内网域名或 IP
    
    root /var/www/equity-chart;
    index index.html;
    
    # 支持 Vue Router 的 history 模式
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

3. 重启 Nginx：

```bash
sudo nginx -t
sudo systemctl restart nginx
```

##### 使用 Apache

1. 将 `dist` 文件夹复制到服务器（例如 `/var/www/html/equity-chart`）

2. 在 `dist` 文件夹中创建 `.htaccess` 文件：

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /equity-chart/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /equity-chart/index.html [L]
</IfModule>
```

3. 确保 Apache 启用了 `mod_rewrite` 模块：

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

##### 使用 IIS（Windows Server）

1. 将 `dist` 文件夹复制到 IIS 网站目录

2. 在 `dist` 文件夹中创建 `web.config` 文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Handle History Mode and custom 404/500" stopProcessing="true">
          <match url="(.*)" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
```

3. 在 IIS 管理器中配置网站

### 方式二：开发服务器部署

如果内网服务器有 Node.js 环境，可以直接运行开发服务器。

#### 1. 将整个项目复制到服务器

```bash
# 打包项目（排除 node_modules）
tar -czf equity-chart.tar.gz --exclude=node_modules --exclude=dist .
```

#### 2. 在服务器上解压并安装依赖

```bash
tar -xzf equity-chart.tar.gz
cd equity-chart
npm install
```

#### 3. 配置环境变量

创建 `.env.production` 文件：

```env
VITE_DATA_MODE=api
VITE_API_BASE_URL=http://your-internal-api.com
```

#### 4. 启动服务

```bash
# 开发模式（不推荐用于生产）
npm run dev -- --host 0.0.0.0 --port 5173

# 或者先构建再使用 preview
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

#### 5. 使用 PM2 保持服务运行（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start npm --name "equity-chart" -- run preview -- --host 0.0.0.0 --port 4173

# 设置开机自启
pm2 startup
pm2 save
```

## 离线依赖处理

如果内网环境无法访问 npm 仓库，需要在有网络的机器上准备依赖。

### 方法一：使用 npm pack

```bash
# 在有网络的机器上
npm install
npm pack

# 将生成的 .tgz 文件和 node_modules 一起打包
tar -czf equity-chart-with-deps.tar.gz .
```

### 方法二：使用私有 npm 仓库

1. 在内网搭建 Verdaccio 或 Nexus 私有仓库
2. 将依赖同步到私有仓库
3. 配置 `.npmrc` 指向私有仓库

```bash
registry=http://your-internal-npm-registry.com/
```

## 数据配置

### 使用导入的 Excel 数据

系统默认使用 API 模式，从 localStorage 读取导入的数据。无需额外配置。

### 连接内网 API

如果需要连接内网的真实 API：

1. 修改 `src/api/equityPenetrationChart/index.js` 中的 `fetchRealApiData` 函数

2. 配置 API 地址：

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://your-internal-api.com'

async function fetchRealApiData(params) {
  const response = await fetch(`${API_BASE_URL}/api/equity/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })
  
  return await response.json()
}
```

3. 在 `.env.production` 中配置：

```env
VITE_API_BASE_URL=http://your-internal-api.com
```

## 安全配置

### 1. HTTPS 配置（推荐）

如果内网有 SSL 证书，建议启用 HTTPS：

```nginx
server {
    listen 443 ssl http2;
    server_name your-intranet-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # ... 其他配置
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-intranet-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 2. 访问控制

如果需要限制访问，可以配置 IP 白名单：

```nginx
location / {
    allow 192.168.1.0/24;  # 允许的 IP 段
    allow 10.0.0.0/8;
    deny all;
    
    try_files $uri $uri/ /index.html;
}
```

### 3. 基本认证

添加简单的用户名密码认证：

```nginx
location / {
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    try_files $uri $uri/ /index.html;
}
```

创建密码文件：

```bash
sudo htpasswd -c /etc/nginx/.htpasswd username
```

## 性能优化

### 1. 启用 Gzip 压缩

已在 Nginx 配置示例中包含。

### 2. 配置缓存策略

```nginx
# 静态资源长期缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# HTML 文件不缓存
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### 3. 使用 CDN（如果内网有）

如果内网有 CDN 服务，可以将静态资源上传到 CDN。

## 监控和日志

### 1. Nginx 访问日志

```nginx
access_log /var/log/nginx/equity-chart-access.log;
error_log /var/log/nginx/equity-chart-error.log;
```

### 2. 应用日志

浏览器控制台会输出详细的日志，可以使用浏览器开发者工具查看。

## 故障排查

### 问题 1：页面刷新后 404

**原因**：Web 服务器没有配置 SPA 路由支持

**解决**：参考上面的 Nginx/Apache/IIS 配置，添加路由重写规则

### 问题 2：静态资源加载失败

**原因**：`base` 路径配置不正确

**解决**：检查 `vite.config.js` 中的 `base` 配置是否与实际部署路径一致

### 问题 3：Excel 导入失败

**原因**：XLSX 库未正确加载

**解决**：确保 `node_modules` 中有 `xlsx` 包，重新构建项目

### 问题 4：跨域问题

**原因**：前端和 API 不在同一域名

**解决**：配置 Nginx 反向代理或在 API 服务器启用 CORS

```nginx
location /api/ {
    proxy_pass http://your-internal-api.com/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 更新部署

### 1. 构建新版本

```bash
npm run build
```

### 2. 备份当前版本

```bash
cp -r /var/www/equity-chart /var/www/equity-chart-backup-$(date +%Y%m%d)
```

### 3. 部署新版本

```bash
rm -rf /var/www/equity-chart/*
cp -r dist/* /var/www/equity-chart/
```

### 4. 清除浏览器缓存

通知用户清除浏览器缓存或使用 Ctrl+F5 强制刷新。

## 备份策略

### 1. 定期备份

```bash
# 创建备份脚本
#!/bin/bash
BACKUP_DIR="/backup/equity-chart"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份应用文件
tar -czf $BACKUP_DIR/app-$DATE.tar.gz /var/www/equity-chart

# 备份 localStorage 数据（需要用户手动导出）
# 或者备份数据库（如果使用）

# 保留最近 30 天的备份
find $BACKUP_DIR -name "app-*.tar.gz" -mtime +30 -delete
```

### 2. 设置定时任务

```bash
# 编辑 crontab
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /path/to/backup-script.sh
```

## 技术支持

如有问题，请查看：
- 项目 README.md
- docs/ 目录下的其他文档
- 浏览器控制台日志
- Web 服务器错误日志

## 附录：完整部署检查清单

- [ ] Node.js 和 npm 已安装
- [ ] 项目依赖已安装（npm install）
- [ ] 生产构建成功（npm run build）
- [ ] dist 文件夹已复制到服务器
- [ ] Web 服务器已配置（Nginx/Apache/IIS）
- [ ] 路由重写规则已配置
- [ ] 静态资源缓存已配置
- [ ] Gzip 压缩已启用
- [ ] 访问控制已配置（如需要）
- [ ] HTTPS 已配置（如需要）
- [ ] 防火墙规则已配置
- [ ] 备份策略已设置
- [ ] 监控和日志已配置
- [ ] 浏览器访问测试通过
- [ ] Excel 导入功能测试通过
- [ ] 股权图显示测试通过
- [ ] 弹窗跳转功能测试通过
