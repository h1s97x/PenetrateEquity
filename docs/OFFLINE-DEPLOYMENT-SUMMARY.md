# 离线部署总结

## 快速参考

### 你需要什么？

**最简单的方式（推荐）：**
- ✅ 一台 Web 服务器（Nginx/Apache/IIS）
- ✅ `dist` 文件夹（约 2-5 MB）
- ❌ 不需要 Node.js
- ❌ 不需要网络

### 三步部署

#### 步骤 1：在有网络的机器上准备

```bash
# Linux/Mac
chmod +x prepare-offline.sh
./prepare-offline.sh

# Windows
双击运行 prepare-offline.bat
```

这会生成 `offline-package` 目录，包含所有需要的文件。

#### 步骤 2：复制到内网

将 `offline-package` 目录复制到 U 盘，然后复制到内网服务器。

#### 步骤 3：在内网服务器上部署

**Nginx（Linux）：**

```bash
# 解压
tar -xzf equity-chart-dist.tar.gz

# 复制文件
sudo mkdir -p /var/www/equity-chart
sudo cp -r dist/* /var/www/equity-chart/

# 配置 Nginx（参考 OFFLINE-DEPLOYMENT.md）
sudo nano /etc/nginx/conf.d/equity-chart.conf

# 重启服务
sudo systemctl restart nginx
```

**IIS（Windows）：**

1. 解压 `equity-chart-dist.zip`
2. 复制 `dist` 文件夹内容到 `C:\inetpub\wwwroot\equity-chart\`
3. 创建 `web.config` 文件（参考文档）
4. 在 IIS 管理器中创建网站
5. 启动网站

## 文件说明

### offline-package 目录内容

```
offline-package/
├── equity-chart-dist.tar.gz      # 构建产物（推荐使用）
├── equity-chart-full.tar.gz      # 完整项目（包含源码）
├── OFFLINE-DEPLOYMENT.md         # 详细部署文档
├── DEPLOYMENT-CHECKLIST.md       # 部署检查清单
├── README.txt                    # 快速开始指南
└── FILE-LIST.txt                 # 文件清单
```

### 使用哪个文件？

| 文件 | 大小 | 需要 Node.js | 推荐 | 说明 |
|------|------|-------------|------|------|
| equity-chart-dist.tar.gz | 2-5 MB | ❌ | ⭐⭐⭐ | 只包含构建产物，最简单 |
| equity-chart-full.tar.gz | 100-200 MB | ✅ | ⭐ | 包含源码和依赖，可修改 |

**推荐使用 `equity-chart-dist.tar.gz`**

## 部署方案对比

### 方案 A：静态文件 + Web 服务器（推荐）

**优点：**
- ✅ 最简单
- ✅ 不需要 Node.js
- ✅ 性能最好
- ✅ 最稳定
- ✅ 资源占用少

**缺点：**
- ❌ 需要配置 Web 服务器

**适用场景：**
- 生产环境
- 长期运行
- 对性能有要求

### 方案 B：Node.js 运行

**优点：**
- ✅ 可以修改代码
- ✅ 开发调试方便

**缺点：**
- ❌ 需要安装 Node.js
- ❌ 资源占用较多
- ❌ 需要保持进程运行

**适用场景：**
- 开发测试
- 临时演示
- 需要修改代码

## 常见问题

### Q1: 内网完全没有网络，能部署吗？

**A:** 可以！使用方案 A（静态文件部署），只需要：
1. 在有网络的机器上运行 `prepare-offline.sh`
2. 将生成的文件复制到内网
3. 部署到 Web 服务器

### Q2: 内网服务器没有 Node.js，能运行吗？

**A:** 可以！使用方案 A（静态文件部署），不需要 Node.js。

### Q3: 需要安装什么软件？

**A:** 只需要一个 Web 服务器：
- Linux: Nginx 或 Apache
- Windows: IIS

### Q4: 文件有多大？

**A:** 
- 构建产物：2-5 MB
- 完整项目：100-200 MB

推荐只复制构建产物。

### Q5: 部署需要多长时间？

**A:** 
- 准备文件：5-10 分钟
- 部署到服务器：5-10 分钟
- 总计：10-20 分钟

### Q6: 如何更新版本？

**A:**
1. 在有网络的机器上重新构建
2. 复制新的 `dist` 文件夹到内网
3. 替换旧文件
4. 重启 Web 服务器

### Q7: 支持哪些浏览器？

**A:** 
- Chrome/Edge（推荐）
- Firefox
- Safari
- IE 11+（部分功能可能不支持）

### Q8: 数据存储在哪里？

**A:** 
- 导入的数据存储在浏览器的 localStorage
- 不需要数据库
- 数据在用户浏览器本地

### Q9: 多个用户可以同时使用吗？

**A:** 
- 可以！每个用户独立使用
- 数据互不影响
- 支持多用户并发访问

### Q10: 如何备份数据？

**A:**
- 用户可以在"导入历史"页面导出数据
- 或者备份浏览器的 localStorage
- 建议定期导出 Excel 文件

## 技术支持

### 部署问题

1. **查看浏览器控制台**
   - 按 F12 打开开发者工具
   - 查看 Console 标签的错误信息

2. **查看 Web 服务器日志**
   - Nginx: `/var/log/nginx/error.log`
   - Apache: `/var/log/httpd/error_log`
   - IIS: 事件查看器

3. **检查文件权限**
   ```bash
   ls -la /var/www/equity-chart
   ```

4. **检查防火墙**
   ```bash
   sudo firewall-cmd --list-ports
   ```

### 功能问题

1. **Excel 导入失败**
   - 检查文件格式（.xlsx 或 .xls）
   - 检查文件大小（< 10MB）
   - 查看浏览器控制台错误

2. **图表不显示**
   - 检查是否有数据
   - 查看浏览器控制台错误
   - 尝试刷新页面（Ctrl+F5）

3. **页面刷新后 404**
   - 检查 Web 服务器路由配置
   - 参考 OFFLINE-DEPLOYMENT.md 配置路由重写

## 相关文档

- [离线部署详细指南](./OFFLINE-DEPLOYMENT.md)
- [部署检查清单](./DEPLOYMENT-CHECKLIST.md)
- [内网部署指南](./INTRANET-DEPLOYMENT.md)
- [快速开始](./QUICKSTART-INTRANET.md)

## 联系方式

如有问题，请：
1. 查看文档
2. 检查浏览器控制台
3. 查看服务器日志
4. 参考部署检查清单

---

**推荐部署方案：静态文件 + Nginx**

这是最简单、最稳定、性能最好的部署方式！
