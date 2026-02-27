#!/bin/bash

# 股权穿透图可视化系统 - 部署脚本
# 用于快速部署到内网环境

set -e

echo "=========================================="
echo "股权穿透图可视化系统 - 部署脚本"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
echo "检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js，请先安装 Node.js >= 16.x${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}错误: Node.js 版本过低，需要 >= 16.x，当前版本: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js 版本: $(node -v)${NC}"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: 未找到 npm${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm 版本: $(npm -v)${NC}"
echo ""

# 询问部署类型
echo "请选择部署类型:"
echo "1) 生产构建（推荐）"
echo "2) 开发服务器"
read -p "请输入选项 (1 或 2): " DEPLOY_TYPE

if [ "$DEPLOY_TYPE" = "1" ]; then
    echo ""
    echo "=========================================="
    echo "开始生产构建..."
    echo "=========================================="
    echo ""
    
    # 安装依赖
    echo "安装依赖..."
    npm install
    
    # 构建
    echo ""
    echo "构建项目..."
    npm run build
    
    if [ ! -d "dist" ]; then
        echo -e "${RED}错误: 构建失败，未找到 dist 目录${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}✓ 构建成功！${NC}"
    echo ""
    echo "=========================================="
    echo "部署信息"
    echo "=========================================="
    echo "构建输出目录: $(pwd)/dist"
    echo ""
    echo "下一步操作:"
    echo "1. 将 dist 目录复制到 Web 服务器"
    echo "2. 配置 Web 服务器（参考 docs/INTRANET-DEPLOYMENT.md）"
    echo "3. 重启 Web 服务器"
    echo ""
    echo "示例命令（Nginx）:"
    echo "  sudo cp -r dist/* /var/www/equity-chart/"
    echo "  sudo systemctl restart nginx"
    echo ""
    
elif [ "$DEPLOY_TYPE" = "2" ]; then
    echo ""
    echo "=========================================="
    echo "启动开发服务器..."
    echo "=========================================="
    echo ""
    
    # 安装依赖
    echo "安装依赖..."
    npm install
    
    # 询问端口
    read -p "请输入端口号 (默认 5173): " PORT
    PORT=${PORT:-5173}
    
    echo ""
    echo -e "${GREEN}启动服务器...${NC}"
    echo "访问地址: http://localhost:$PORT"
    echo "按 Ctrl+C 停止服务器"
    echo ""
    
    npm run dev -- --host 0.0.0.0 --port $PORT
    
else
    echo -e "${RED}无效的选项${NC}"
    exit 1
fi
