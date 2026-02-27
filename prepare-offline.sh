#!/bin/bash

# 离线部署准备脚本
# 在有网络的机器上运行此脚本，准备离线部署所需的所有文件

set -e

echo "=========================================="
echo "股权穿透图 - 离线部署准备脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查 Node.js
echo "检查环境..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js: $(node -v)${NC}"
echo -e "${GREEN}✓ npm: $(npm -v)${NC}"
echo ""

# 创建输出目录
OUTPUT_DIR="offline-package"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

echo "=========================================="
echo "步骤 1: 安装依赖"
echo "=========================================="
echo ""

npm install

echo ""
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

echo "=========================================="
echo "步骤 2: 构建生产版本"
echo "=========================================="
echo ""

npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}错误: 构建失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ 构建完成${NC}"
echo ""

echo "=========================================="
echo "步骤 3: 打包文件"
echo "=========================================="
echo ""

# 打包构建产物（推荐）
echo "打包构建产物..."
tar -czf "$OUTPUT_DIR/equity-chart-dist.tar.gz" dist/
DIST_SIZE=$(du -h "$OUTPUT_DIR/equity-chart-dist.tar.gz" | cut -f1)
echo -e "${GREEN}✓ 构建产物已打包: equity-chart-dist.tar.gz ($DIST_SIZE)${NC}"

# 打包完整项目（可选）
echo ""
echo "打包完整项目（包含 node_modules）..."
tar -czf "$OUTPUT_DIR/equity-chart-full.tar.gz" \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='.kiro' \
  --exclude='offline-package' \
  --exclude='*.tar.gz' \
  .
FULL_SIZE=$(du -h "$OUTPUT_DIR/equity-chart-full.tar.gz" | cut -f1)
echo -e "${GREEN}✓ 完整项目已打包: equity-chart-full.tar.gz ($FULL_SIZE)${NC}"

echo ""
echo "=========================================="
echo "步骤 4: 创建部署文档"
echo "=========================================="
echo ""

# 复制部署文档
cp docs/OFFLINE-DEPLOYMENT.md "$OUTPUT_DIR/"
cp docs/DEPLOYMENT-CHECKLIST.md "$OUTPUT_DIR/"

# 创建快速开始文档
cat > "$OUTPUT_DIR/README.txt" << 'EOF'
股权穿透图可视化系统 - 离线部署包
=====================================

本包包含以下文件：
1. equity-chart-dist.tar.gz    - 构建产物（推荐使用）
2. equity-chart-full.tar.gz    - 完整项目（包含源码和依赖）
3. OFFLINE-DEPLOYMENT.md       - 详细部署文档
4. DEPLOYMENT-CHECKLIST.md     - 部署检查清单

快速部署步骤：
=============

方案 A：静态文件部署（推荐，无需 Node.js）
-----------------------------------------

1. 解压构建产物
   tar -xzf equity-chart-dist.tar.gz

2. 部署到 Nginx
   sudo mkdir -p /var/www/equity-chart
   sudo cp -r dist/* /var/www/equity-chart/

3. 配置 Nginx（参考 OFFLINE-DEPLOYMENT.md）

4. 启动服务
   sudo systemctl restart nginx

5. 访问系统
   http://服务器IP


方案 B：使用 Node.js 运行（需要 Node.js）
----------------------------------------

1. 解压完整项目
   tar -xzf equity-chart-full.tar.gz
   cd equity-chart

2. 运行预览服务器
   npm run preview -- --host 0.0.0.0 --port 80

3. 访问系统
   http://服务器IP


详细说明请查看 OFFLINE-DEPLOYMENT.md

技术支持：
- 浏览器控制台（F12）查看错误
- 检查 Web 服务器日志
- 参考部署文档
EOF

echo -e "${GREEN}✓ 部署文档已创建${NC}"

echo ""
echo "=========================================="
echo "步骤 5: 生成文件清单"
echo "=========================================="
echo ""

# 生成文件清单
cat > "$OUTPUT_DIR/FILE-LIST.txt" << EOF
离线部署包文件清单
==================

生成时间: $(date)
Node.js 版本: $(node -v)
npm 版本: $(npm -v)

文件列表:
---------
EOF

cd "$OUTPUT_DIR"
ls -lh >> FILE-LIST.txt
cd ..

echo -e "${GREEN}✓ 文件清单已生成${NC}"

echo ""
echo "=========================================="
echo "准备完成！"
echo "=========================================="
echo ""
echo -e "${BLUE}输出目录: $OUTPUT_DIR${NC}"
echo ""
echo "包含文件:"
echo "  1. equity-chart-dist.tar.gz    ($DIST_SIZE) - 构建产物"
echo "  2. equity-chart-full.tar.gz    ($FULL_SIZE) - 完整项目"
echo "  3. OFFLINE-DEPLOYMENT.md       - 部署文档"
echo "  4. DEPLOYMENT-CHECKLIST.md     - 检查清单"
echo "  5. README.txt                  - 快速开始"
echo "  6. FILE-LIST.txt               - 文件清单"
echo ""
echo -e "${YELLOW}下一步操作:${NC}"
echo "1. 将 $OUTPUT_DIR 目录复制到 U 盘或移动硬盘"
echo "2. 在内网服务器上解压文件"
echo "3. 按照 OFFLINE-DEPLOYMENT.md 文档部署"
echo ""
echo -e "${GREEN}推荐使用方案 A（静态文件 + Nginx）${NC}"
echo ""
