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

# 清理端口占用
cleanup_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}⚠️  端口 $port 被占用，正在清理...${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# 等待后端健康检查
wait_for_backend() {
    local max_attempts=30
    local attempt=1
    echo -e "${YELLOW}⏳ 等待后端启动...${NC}"
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:3000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 后端已就绪${NC}"
            return 0
        fi
        sleep 0.5
        attempt=$((attempt + 1))
    done
    echo -e "${RED}❌ 后端启动超时${NC}"
    return 1
}

echo -e "${GREEN}📦 检查依赖...${NC}"
check_deps "backend"
check_deps "frontend"

# 清理可能残留的端口占用
echo -e "${GREEN}🧹 清理端口...${NC}"
cleanup_port 3000
cleanup_port 5173

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}🛑 正在关闭服务...${NC}"
    # 杀掉后端进程组
    kill -TERM -$BACKEND_PID 2>/dev/null || kill $BACKEND_PID 2>/dev/null || true
    # 杀掉前端进程组
    kill -TERM -$FRONTEND_PID 2>/dev/null || kill $FRONTEND_PID 2>/dev/null || true
    # 确保端口释放
    cleanup_port 3000
    cleanup_port 5173
    echo -e "${GREEN}✅ 已关闭所有服务${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 启动后端
echo -e "${GREEN}🚀 启动后端服务 (端口 3000)...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端健康检查通过
wait_for_backend || {
    echo -e "${RED}后端启动失败，退出${NC}"
    exit 1
}

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


