# Easy Chat Web

基于 Vue3 + Vite 的现代化聊天应用前端。

## 🚀 快速开始

### 安装依赖
```bash
npm install
# 或使用 pnpm (推荐)
pnpm install
```

### 开发环境
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 代码检查
```bash
npm run lint
```

### 代码格式化
```bash
npm run format
```

## 📁 项目结构

```
src/
├── api/                    # API接口
│   └── modules/           # 按模块组织的API
├── assets/                # 静态资源
├── components/            # 组件
│   ├── Common/           # 通用组件
│   ├── Chat/             # 聊天组件
│   ├── User/             # 用户组件
│   └── Social/           # 社交组件
├── hooks/                 # 组合式API
├── router/                # 路由配置
├── stores/                # Pinia状态管理
├── styles/                # 样式文件
├── types/                 # TypeScript类型定义
├── utils/                 # 工具函数
└── views/                 # 页面组件
```

## 🛠 技术栈

- **框架**: Vue 3
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **UI库**: Element Plus
- **HTTP客户端**: Axios
- **WebSocket**: Socket.io
- **样式**: SCSS
- **代码规范**: ESLint + Prettier

## 🔧 配置说明

### 代理配置
开发环境下，API请求会被代理到后端服务：
- `/api` -> `http://localhost:8888`
- `/ws` -> `ws://localhost:9001`

### 环境变量
可以在项目根目录创建 `.env.local` 文件来配置环境变量：

```bash
VITE_API_BASE_URL=http://localhost:8888
VITE_WS_URL=ws://localhost:9001
```

## 📝 开发指南

### 添加新页面
1. 在 `src/views/` 下创建新的Vue组件
2. 在 `src/router/modules/` 下添加路由配置
3. 在主路由文件中引入新的路由模块

### 添加新API
1. 在 `src/api/modules/` 下创建对应的API文件
2. 在 `src/api/index.js` 中导出新的API模块

### 状态管理
使用Pinia进行状态管理，按模块组织：
- `user` - 用户信息和认证状态
- `chat` - 聊天消息和会话
- `social` - 好友和群组信息
- `app` - 应用全局状态

## 🎨 样式规范

- 使用SCSS作为CSS预处理器
- 遵循BEM命名规范
- 使用CSS变量来管理主题色彩
- 响应式设计优先

## 📱 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request