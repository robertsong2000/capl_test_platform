# CAPL测试平台 (CAPL Test Platform)

一个基于Web的CAPL测试用例管理平台，提供测试用例管理、CAPL脚本编辑、测试执行和结果展示等功能。

## 🌟 项目特点

- **零安装**: 浏览器直接访问，无需安装任何软件
- **跨平台**: 支持所有主流操作系统（Windows、macOS、Linux）
- **本地存储**: 数据存储在浏览器本地，保护隐私安全
- **现代化界面**: 基于Element Plus的企业级UI设计
- **多格式支持**: 支持JSON、Excel、CSV、HTML等格式导入导出

## 🚀 快速开始

### 开发环境

```bash
# 克隆项目
git clone https://github.com/robertsong2000/capl_test_platform.git
cd capl_test_platform/web-frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 生产部署

```bash
# 构建生产版本
pnpm build

# 构建后的文件在dist目录，可直接部署到任何静态文件服务器
```

## 📋 功能特性

### ✅ 已实现功能 (V2.0.0)

#### 测试用例管理
- ✅ 项目管理（创建、编辑、删除）
- ✅ 测试用例管理（增删改查、优先级设置）
- ✅ 测试步骤管理（步骤描述、预期结果）
- ✅ 项目树形结构展示
- ✅ 测试用例与CAPL脚本关联

#### CAPL脚本编辑
- ✅ Monaco Editor集成
- ✅ CAPL语法高亮
- ✅ 多标签页代码编辑
- ✅ 代码自动保存
- ✅ 代码与测试用例关联

#### 文件操作
- ✅ 数据导入（JSON/Excel/CSV）
- ✅ 数据导出（JSON/Excel/CSV/HTML）
- ✅ 批量导入导出功能
- ✅ HTML测试报告生成
- ✅ 文件下载功能

#### 系统功能
- ✅ 响应式界面设计
- ✅ 主题切换（浅色/深色/自动）
- ✅ 多语言支持框架
- ✅ 本地数据自动保存
- ✅ 系统设置管理

### 🔄 部分实现功能
- 🔄 CAPL语法检查（进行中）
- 🔄 代码自动补全（待完善）
- 🔄 测试执行功能（框架已搭建）
- 🔄 测试结果展示（界面已创建）

### ⏳ 待实现功能
- ⏳ 测试执行引擎
- ⏳ 实时测试监控
- ⏳ 测试结果分析
- ⏳ 代码模板管理
- ⏳ 团队协作功能

## 🛠 技术栈

### 前端技术
- **框架**: Vue.js 3.4.0
- **UI组件库**: Element Plus 2.4.4
- **代码编辑器**: Monaco Editor 0.45.0
- **路由管理**: Vue Router 4.2.5
- **构建工具**: Vite 5.0.10

### 数据处理
- **本地存储**: LocalStorage API
- **文件操作**: HTML5 File API
- **Excel处理**: SheetJS (xlsx 0.18.5)
- **日期处理**: Day.js 1.11.10

### 代码规范
- **代码检查**: ESLint
- **代码格式化**: Prettier
- **类型检查**: TypeScript支持

## 📁 项目结构

```
capl_test_platform/
├── web-frontend/                 # Web前端项目
│   ├── src/
│   │   ├── App.vue              # 主应用组件
│   │   ├── main.js              # 应用入口
│   │   ├── router/              # 路由配置
│   │   ├── views/               # 页面组件
│   │   │   ├── Home.vue         # 首页（测试用例管理）
│   │   │   ├── Editor.vue       # CAPL代码编辑器
│   │   │   ├── Execution.vue    # 测试执行
│   │   │   └── Results.vue      # 测试结果
│   │   ├── services/            # 服务模块
│   │   │   ├── localStorage.js  # 本地数据管理
│   │   │   └── fileManager.js   # 文件操作管理
│   │   └── components/          # 公共组件
│   ├── package.json             # 项目配置
│   └── vite.config.js           # Vite配置
├── requirements.md              # 需求文档
└── design.md                    # 设计文档
```

## 💾 数据存储

使用浏览器LocalStorage进行本地数据存储，存储键为 `capl_test_platform_v2`。

### 数据模型
- **项目**: 包含项目基本信息
- **测试用例**: 关联到项目，包含用例详情
- **测试步骤**: 关联到测试用例
- **CAPL脚本**: 代码内容和元数据
- **测试执行**: 执行历史和结果
- **系统配置**: 用户设置和偏好

## 🌐 浏览器支持

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ 移动端浏览器（响应式设计）

## 🚀 部署方式

### GitHub Pages 部署
1. 构建项目: `pnpm build`
2. 将 `dist` 目录内容推送到 `gh-pages` 分支
3. 在GitHub仓库设置中启用GitHub Pages

### 静态文件服务器
构建后的文件可以直接部署到任何静态文件服务器：
- Nginx
- Apache
- 阿里云OSS
- 腾讯云COS
- Vercel
- Netlify

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支: `git checkout -b feature/新功能`
3. 提交更改: `git commit -m '添加新功能'`
4. 推送分支: `git push origin feature/新功能`
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目地址: https://github.com/robertsong2000/capl_test_platform
- 邮箱: robertsong.japan@gmail.com

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Element Plus](https://element-plus.org/) - Vue 3 UI库
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 代码编辑器
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

---

⭐ 如果这个项目对你有帮助，请给个Star支持一下！