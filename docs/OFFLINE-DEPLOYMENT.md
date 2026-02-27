# 离线部署指南（无网络环境）

## 概述

本指南适用于完全无网络的内网环境，需要在有网络的机器上准备好所有依赖，然后整体复制到内网。

## 准备工作（在有网络的机器上）

### 1. 安装依赖并构建

```bash
# 克隆或下载项目
cd equity-chart

# 安装所有依赖
npm install

# 构建生产版本
npm run build
```

### 2. 打包整个项目

**方式一：打包完整项目（包含 node_modules）**

```bash
# Linux/Mac
tar -czf equity-chart-full.tar.gz \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='.kiro' \
  .

# Windows (使用 7-Zip 或 WinRAR)
# 排除 .git, .github, .kiro 文件夹
# 压缩整个项目文件夹
```

**方式二：只打包构建产物（推荐，体积小）**

```bash
# Linux/Mac
tar -czf equity-chart-dist.tar.gz dist/

# Windows
# 压缩 dist 文件夹
```

### 3. 准备 Node.js 安装包（如果内网没有）

下载对应操作系统的 Node.js 安装包：

- **Windows**: https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi
- **Linux (x64)**: https://nodejs.org/dist/v18.18.0/node-v18.18.0-linux-x64.tar.xz
- **Mac**: https://nodejs.org/dist/v18.18.0/node-v18.18.0-darwin-x64.tar.gz

## 内网部署步骤

### 方案 A：静态文件部署（推荐，无需 Node.js）

这是最简单的方式，只需要一个 Web 服务器。

#### 1. 准备文件

将 `equity-chart-dist.tar.gz` 或 `dist` 文件夹复制到内网服务器。

#### 2. 解压文件

```bash
# Linux/Mac
tar -xzf equity-chart-dist.tar.gz

# Windows
# 使用 7-Zip 或 WinRAR 解压
```

#### 3. 部署到 Web 服务器

##### Nginx（Linux）

```bash
# 1. 安装 Nginx（如果未安装）
sudo yum install nginx  # CentOS/RHEL
# 或
sudo apt install nginx  # Ubuntu/Debian

# 2. 复制文件
sudo mkdir -p /var/www/equity-chart
sudo cp -r dist/* /var/www/equity-chart/

# 3. 创建配置文件
sudo nano /etc/nginx/conf.d/equity-chart.conf
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name localhost;  # 或你的内网 IP
    
    root /var/www/equity-chart;
    index index.html;
    
    # 支持 Vue Router
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
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

```bash
# 4. 测试配置
sudo nginx -t

# 5. 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 6. 开放防火墙端口
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
```

##### Apache（Linux）

```bash
# 1. 安装 Apache
sudo yum install httpd  # CentOS/RHEL
# 或
sudo apt install apache2  # Ubuntu/Debian

# 2. 复制文件
sudo mkdir -p /var/www/html/equity-chart
sudo cp -r dist/* /var/www/html/equity-chart/

# 3. 创建 .htaccess
sudo nano /var/www/html/equity-chart/.htaccess
```

添加以下内容：

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

```bash
# 4. 启用 mod_rewrite
sudo a2enmod rewrite

# 5. 修改 Apache 配置允许 .htaccess
sudo nano /etc/httpd/conf/httpd.conf
# 找到 <Directory "/var/www/html"> 部分
# 将 AllowOverride None 改为 AllowOverride All

# 6. 启动 Apache
sudo systemctl start httpd
sudo systemctl enable httpd

# 7. 开放防火墙端口
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
```

##### IIS（Windows Server）

1. **安装 IIS**
   - 打开"服务器管理器"
   - 添加角色和功能
   - 选择"Web 服务器 (IIS)"
   - 安装"URL Rewrite"模块（从 Microsoft 官网下载）

2. **部署文件**
   - 解压 dist 文件夹到 `C:\inetpub\wwwroot\equity-chart`

3. **创建 web.config**
   
   在 `C:\inetpub\wwwroot\equity-chart\` 创建 `web.config` 文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="Handle History Mode" stopProcessing="true">
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

4. **配置 IIS**
   - 打开 IIS 管理器
   - 右键"网站" → "添加网站"
   - 网站名称: equity-chart
   - 物理路径: `C:\inetpub\wwwroot\equity-chart`
   - 端口: 80
   - 启动网站

5. **配置防火墙**
   - 打开"Windows 防火墙"
   - 允许端口 80 入站

#### 4. 访问系统

打开浏览器访问：
- `http://服务器IP`
- 或 `http://localhost`（在服务器本机）

### 方案 B：使用 Node.js 运行（需要 Node.js）

如果内网服务器需要安装 Node.js。

#### 1. 安装 Node.js

**Linux:**

```bash
# 解压 Node.js
tar -xJf node-v18.18.0-linux-x64.tar.xz
sudo mv node-v18.18.0-linux-x64 /usr/local/nodejs

# 配置环境变量
echo 'export PATH=/usr/local/nodejs/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 验证安装
node -v
npm -v
```

**Windows:**

双击运行 `node-v18.18.0-x64.msi`，按提示安装。

#### 2. 解压项目

```bash
# Linux/Mac
tar -xzf equity-chart-full.tar.gz
cd equity-chart

# Windows
# 解压 equity-chart-full.tar.gz
# 进入项目目录
```

#### 3. 运行项目

**方式一：使用预览服务器（推荐）**

```bash
# 项目已经构建好，直接预览
npm run preview -- --host 0.0.0.0 --port 80
```

**方式二：开发服务器**

```bash
# 如果需要修改代码
npm run dev -- --host 0.0.0.0 --port 80
```

**方式三：使用 PM2 保持运行**

```bash
# 安装 PM2（如果 node_modules 中没有）
npm install -g pm2

# 启动服务
pm2 start npm --name "equity-chart" -- run preview -- --host 0.0.0.0 --port 80

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs equity-chart
```

#### 4. 访问系统

打开浏览器访问：`http://服务器IP`

## 所需环境总结

### 方案 A：静态文件部署（推荐）

**必需：**
- Web 服务器（Nginx/Apache/IIS 三选一）
- 操作系统（Linux/Windows Server）

**不需要：**
- ❌ Node.js
- ❌ npm
- ❌ 网络连接

**优点：**
- 部署简单
- 资源占用少
- 性能好
- 稳定性高

### 方案 B：Node.js 运行

**必需：**
- Node.js >= 16.x
- 操作系统（Linux/Windows Server）

**不需要：**
- ❌ 网络连接（依赖已打包）

**优点：**
- 可以修改代码
- 开发调试方便

**缺点：**
- 需要安装 Node.js
- 资源占用较多

## 文件清单

### 最小部署（方案 A）

需要复制到内网的文件：

```
equity-chart-dist.tar.gz  (约 2-5 MB)
或
dist/
  ├── index.html
  ├── assets/
  │   ├── index-xxxxx.js
  │   ├── index-xxxxx.css
  │   └── ...
  └── ...
```

### 完整部署（方案 B）

需要复制到内网的文件：

```
equity-chart-full.tar.gz  (约 100-200 MB)
或
equity-chart/
  ├── dist/              # 构建产物
  ├── node_modules/      # 依赖包
  ├── src/               # 源代码
  ├── public/            # 公共资源
  ├── package.json       # 项目配置
  ├── vite.config.js     # 构建配置
  └── ...
```

### Node.js 安装包（如需要）

```
node-v18.18.0-x64.msi           (Windows, 约 30 MB)
node-v18.18.0-linux-x64.tar.xz  (Linux, 约 20 MB)
node-v18.18.0-darwin-x64.tar.gz (Mac, 约 20 MB)
```

## 快速部署命令

### 在有网络的机器上准备

```bash
# 1. 安装依赖并构建
npm install
npm run build

# 2. 打包（选择一种方式）

# 方式 A：只打包构建产物（推荐）
tar -czf equity-chart-dist.tar.gz dist/

# 方式 B：打包完整项目
tar -czf equity-chart-full.tar.gz \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='.kiro' \
  .
```

### 在内网服务器上部署

**Nginx 快速部署：**

```bash
# 1. 解压
tar -xzf equity-chart-dist.tar.gz

# 2. 复制文件
sudo mkdir -p /var/www/equity-chart
sudo cp -r dist/* /var/www/equity-chart/

# 3. 创建 Nginx 配置
sudo tee /etc/nginx/conf.d/equity-chart.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name localhost;
    root /var/www/equity-chart;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 4. 启动服务
sudo nginx -t
sudo systemctl restart nginx
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
```

**IIS 快速部署：**

```cmd
REM 1. 解压到 C:\inetpub\wwwroot\equity-chart

REM 2. 创建 web.config（手动创建，内容见上文）

REM 3. 在 IIS 管理器中创建网站
REM    - 物理路径: C:\inetpub\wwwroot\equity-chart
REM    - 端口: 80

REM 4. 启动网站
```

## 验证部署

部署完成后，访问系统并测试：

1. ✅ 打开浏览器访问 `http://服务器IP`
2. ✅ 首页正常显示
3. ✅ 点击"查看示例数据"
4. ✅ 查看股权穿透图
5. ✅ 测试 Excel 导入功能
6. ✅ 测试节点点击和跳转

## 常见问题

### 1. 页面无法访问

**检查：**
- Web 服务器是否启动：`sudo systemctl status nginx`
- 防火墙是否开放端口：`sudo firewall-cmd --list-ports`
- 文件权限是否正确：`ls -la /var/www/equity-chart`

### 2. 页面刷新后 404

**原因：** 未配置 SPA 路由支持

**解决：** 检查 Nginx/Apache/IIS 配置中的路由重写规则

### 3. 静态资源加载失败

**原因：** 路径配置不正确

**解决：** 
- 检查 `vite.config.js` 中的 `base` 配置
- 确保部署路径与配置一致

### 4. Excel 导入失败

**原因：** XLSX 库未正确打包

**解决：** 
- 确保使用 `npm install` 安装了所有依赖
- 重新构建：`npm run build`

## 技术支持

如有问题，请检查：
- 浏览器控制台（F12）
- Web 服务器日志
- 系统日志

---

**推荐部署方案：方案 A（静态文件 + Nginx）**

这是最简单、最稳定、性能最好的部署方式。
