# ATLAS Docs OS Backend Dockerfile

FROM node:20-alpine

# 安装 Git（用于 simple-git）
RUN apk add --no-cache git

WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 设置 Git 配置（用于自动 commit）
RUN git config --global user.name "ATLAS Docs OS" && \
    git config --global user.email "atlas@local" && \
    git config --global init.defaultBranch main

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/index.js"]

