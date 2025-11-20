#!/bin/bash

# Git推送辅助脚本
# 帮助您快速将项目推送到GitHub

echo "======================================"
echo "🚀 VideoAI Pro - Git推送助手"
echo "======================================"
echo ""

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 错误：请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 检查Git是否初始化
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}[1/4] 初始化Git仓库...${NC}"
    git init
    git branch -M main
else
    echo -e "${GREEN}[1/4] Git仓库已存在 ✓${NC}"
fi

# 添加所有文件
echo -e "${YELLOW}[2/4] 添加所有文件...${NC}"
git add .

# 提交
echo -e "${YELLOW}[3/4] 提交代码...${NC}"
git commit -m "feat: VideoAI Pro完整项目 - 包含TTS和视频生成功能"

# 询问Git仓库地址
echo ""
echo -e "${YELLOW}[4/4] 推送到远程仓库${NC}"
echo ""
echo "请输入您的GitHub仓库地址（格式: https://github.com/用户名/仓库名.git）:"
echo -e "${GREEN}示例: https://github.com/johndoe/videoai-webapp.git${NC}"
echo ""
read -r REPO_URL

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ 仓库地址不能为空${NC}"
    exit 1
fi

# 检查是否已添加remote
if git remote | grep -q "origin"; then
    echo -e "${YELLOW}更新远程仓库地址...${NC}"
    git remote set-url origin "$REPO_URL"
else
    echo -e "${YELLOW}添加远程仓库...${NC}"
    git remote add origin "$REPO_URL"
fi

# 推送
echo -e "${YELLOW}推送代码到GitHub...${NC}"
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo -e "${GREEN}✅ 推送成功！${NC}"
    echo "======================================"
    echo ""
    echo -e "${GREEN}📦 您的代码已推送到：${NC}"
    echo "  $REPO_URL"
    echo ""
    echo -e "${GREEN}🚀 下一步：${NC}"
    echo "  1. 访问 https://www.runpod.io/ 并登录"
    echo "  2. 创建GPU Pod（RTX 3090，24GB显存）"
    echo "  3. 在Pod中执行："
    echo "     cd /workspace"
    echo "     git clone $REPO_URL"
    echo "     cd videoai-webapp"
    echo "     ./deploy_runpod.sh"
    echo ""
    echo -e "${YELLOW}💡 提示：查看 RUNPOD_QUICKSTART.md 获取详细步骤${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ 推送失败${NC}"
    echo ""
    echo "可能的原因："
    echo "  1. 仓库地址错误"
    echo "  2. 没有权限（需要配置GitHub SSH密钥或Personal Access Token）"
    echo "  3. 网络连接问题"
    echo ""
    echo "解决方案："
    echo "  1. 确认仓库地址正确"
    echo "  2. 配置GitHub认证："
    echo "     - SSH: https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
    echo "     - Token: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token"
    echo ""
    exit 1
fi
