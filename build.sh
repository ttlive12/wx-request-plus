#!/bin/bash

echo "🔨 开始构建 wx-request-plus..."

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目（使用gulp）
echo "🏗️ 使用Gulp编译..."
npm run build

# 检查构建结果
if [ $? -eq 0 ]; then
  echo "✅ 构建成功!"
  echo "🔍 输出目录: $(pwd)/dist (JS文件) 和 $(pwd)/types (类型声明)"
  echo ""
  echo "👉 如果你想要运行严格类型检查，请运行: npm run type-check"
  echo "👉 如果你想要使用严格模式构建，请运行: npm run build:strict"
  echo "👉 如果你想要监视文件变化并自动重新构建，请运行: npm run watch"
else
  echo "❌ 构建失败，请查看上方错误信息"
  exit 1
fi 