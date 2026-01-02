#!/bin/bash

# ATLAS DocsOS 快速启动脚本
# 同时启动前端和后端开发服务器

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║       ATLAS DocsOS 启动脚本           ║"
echo "╚═══════════════════════════════════════╝"
echo -e "${NC}"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查 node_modules
check_deps() {
    if [ ! -d "$1/node_modules" ]; then
        echo -e "${YELLOW}⚠️  $1 缺少依赖，正在安装...${NC}"
        cd "$1" && npm install && cd ..
    fi
}

echo -e "${GREEN}📦 检查依赖...${NC}"
check_deps "backend"
check_deps "frontend"

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}🛑 正在关闭服务...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ 已关闭所有服务${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 启动后端
echo -e "${GREEN}🚀 启动后端服务 (端口 3000)...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 2

# 启动前端
echo -e "${GREEN}🚀 启动前端服务 (端口 5173)...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ATLAS DocsOS 已启动！${NC}"
echo ""
echo -e "   ${BLUE}前端:${NC} http://localhost:5173"
echo -e "   ${BLUE}后端:${NC} http://localhost:3000"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"

# 等待子进程
wait


