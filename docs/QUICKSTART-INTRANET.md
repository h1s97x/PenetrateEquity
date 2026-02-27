# 内网部署快速开始

## 5 分钟快速部署

### Linux/Mac 用户

```bash
# 1. 给脚本添加执行权限
chmod +x deploy.sh

# 2. 运行部署脚本
./deploy.sh

# 3. 选择部署类型
# 选项 1: 生产构建（推荐）
# 选项 2: 开发服务器（测试用）
```

### Windows 用户

```cmd
# 双击运行 deploy.bat
# 或在命令行中运行
deploy.bat
```

## 生产部署（推荐）

### 步骤 1: 构建项目

```bash
npm install
npm run build
```

### 步骤 2: 部署到 Web 服务器

#### Nginx（Linux）

```bash
# 复制文件
sudo cp -r dist/* /var/www/equity-chart/

# 配置 Nginx
sudo nano /etc/nginx/sites-available/equity-chart

# 添加以下配置
server {
    listen 80;
    server_name your-server-ip;
    root /var/www/equity-chart;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 启用站点并重启
sudo ln -s /etc/nginx/sites-available/equity-chart /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### IIS（Windows）

1. 打开 IIS 管理器
2. 右键"网站" → "添加网站"
3. 网站名称: equity-chart
4. 物理路径: 选择 dist 文件夹
5. 端口: 80（或其他可用端口）
6. 在 dist 文件夹中创建 `web.config`（参考 docs/INTRANET-DEPLOYMENT.md）
7. 启动网站

### 步骤 3: 访问系统

打开浏览器访问: `http://your-server-ip`

## 开发服务器部署（测试用）

```bash
# 安装依赖
npm install

# 启动服务器
npm run dev -- --host 0.0.0.0 --port 5173

# 访问
# http://your-server-ip:5173
```

## 离线部署

如果内网无法访问 npm 仓库：

### 方法 1: 打包整个项目

```bash
# 在有网络的机器上
npm install
tar -czf equity-chart-full.tar.gz .

# 在内网机器上
tar -xzf equity-chart-full.tar.gz
npm run build
```

### 方法 2: 只打包构建产物

```bash
# 在有网络的机器上
npm install
npm run build
tar -czf equity-chart-dist.tar.gz dist/

# 在内网机器上
tar -xzf equity-chart-dist.tar.gz
# 直接部署 dist 文件夹
```

## 常见问题

### 1. 页面刷新后 404

需要配置 Web 服务器支持 SPA 路由，参考上面的 Nginx/IIS 配置。

### 2. 端口被占用

修改端口号：

```bash
npm run dev -- --host 0.0.0.0 --port 8080
```

### 3. 权限问题（Linux）

```bash
sudo chown -R www-data:www-data /var/www/equity-chart
sudo chmod -R 755 /var/www/equity-chart
```

### 4. 防火墙问题

```bash
# 开放端口（CentOS/RHEL）
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload

# 开放端口（Ubuntu）
sudo ufw allow 80/tcp
sudo ufw reload
```

## 功能测试

部署完成后，测试以下功能：

1. ✅ 访问首页
2. ✅ 查看示例数据
3. ✅ 导入 Excel 文件
4. ✅ 查看股权穿透图
5. ✅ 点击节点查看详情
6. ✅ 弹窗跳转功能

## 更多信息

详细部署文档: [docs/INTRANET-DEPLOYMENT.md](./INTRANET-DEPLOYMENT.md)

## 技术支持

如有问题，请查看：
- 浏览器控制台（F12）
- Web 服务器日志
- 项目文档目录
