# Easy Chat Web 开发指南

这是一份完整的开发指南，确保您在任何时候都能继续开发这个Vue3聊天应用项目。

## 📋 项目基本信息

**项目路径**: `/testlinux/code/easy-chat-web`  
**后端项目路径**: `/testlinux/code/easy-chat`  
**技术栈**: Vue 3 + Vite + Pinia + Element Plus + SCSS  
**开发端口**: 3000 (前端)，8888 (后端API)，9001 (WebSocket)  

## 🏗️ 当前项目架构状态

### ✅ 已完成的基础架构
- **项目配置**: Vite、ESLint、Prettier、SCSS预处理器
- **路由系统**: 模块化路由配置，支持认证守卫
- **状态管理**: 4个Pinia store (user、chat、social、app)
- **API封装**: axios拦截器、错误处理、模块化API
- **WebSocket管理**: 连接管理、消息处理、重连机制
- **工具函数**: 时间格式化、文件处理、通用工具
- **样式系统**: CSS变量、主题切换、响应式工具类
- **开发工具**: 自动导入、路径别名、代理配置

### ❌ 待实现的主要功能
- 登录/注册页面组件
- 聊天主界面和消息组件
- 好友管理界面
- 群组管理功能
- 文件上传处理
- 消息通知系统

## 🔌 后端接口对接信息

根据后端项目 `/testlinux/code/easy-chat` 的API定义：

### 用户服务接口 (user)
```
POST /v1/user/register - 用户注册
POST /v1/user/login - 用户登录  
GET /v1/user/user - 获取用户信息 (需JWT认证)
```

### 社交服务接口 (social)
```
GET /v1/social/friends - 获取好友列表
POST /v1/social/friend-requests - 发送好友请求
GET /v1/social/friend-requests - 获取好友请求列表
PUT /v1/social/friend-requests - 处理好友请求
DELETE /v1/social/friends/{id} - 删除好友
GET /v1/social/groups - 获取群组列表
POST /v1/social/groups - 创建群组
POST /v1/social/groups/{id}/join - 加入群组
POST /v1/social/groups/{id}/leave - 退出群组
```

### 即时通讯接口 (im)
```
GET /v1/im/conversations - 获取会话列表
GET /v1/im/conversations/{id}/messages - 获取聊天消息
POST /v1/im/messages - 发送消息
PUT /v1/im/conversations/{id}/read - 标记已读
POST /v1/im/upload - 上传文件
```

### WebSocket连接
- **连接地址**: `ws://localhost:9001/ws`
- **认证方式**: JWT token通过auth参数传递
- **消息格式**: 参考后端WebSocket服务实现

## 🎯 详细开发指令模板

### 1. 项目启动和继续开发

#### 基础启动指令
```
"我有一个Vue3聊天应用项目，位于 /testlinux/code/easy-chat-web，后端在 /testlinux/code/easy-chat。
项目基础架构已完成，包含Pinia状态管理、路由配置、API封装等。
现在需要 [具体功能]，请基于现有架构实现。"
```

#### 检查项目状态
```
"检查 /testlinux/code/easy-chat-web 项目的当前状态：
1. 查看已有的组件和页面
2. 确认状态管理和API配置
3. 检查与后端 /testlinux/code/easy-chat 的对接情况
4. 提供下一步开发建议"
```

### 2. 页面组件开发指令

#### 用户认证页面
```
"为Vue3聊天项目创建用户认证页面：
项目位置：/testlinux/code/easy-chat-web
需要实现：
1. src/views/Auth/Login.vue - 登录页面
   - 手机号/密码登录
   - 表单验证（Element Plus）
   - 集成 useUserStore().login() 方法
   - 对接后端 POST /v1/user/login
   - 登录成功跳转到 /chat

2. src/views/Auth/Register.vue - 注册页面  
   - 用户信息填写表单
   - 密码确认验证
   - 集成 useUserStore().register() 方法
   - 对接后端 POST /v1/user/register
   - 注册成功自动登录

要求：使用Element Plus组件，响应式设计，包含加载状态和错误处理"
```

#### 聊天主界面
```
"创建聊天应用的主界面布局：
项目位置：/testlinux/code/easy-chat-web
实现文件：
1. src/views/Chat/ChatLayout.vue - 主容器
   - 三栏布局：侧边栏 + 聊天区 + 信息面板
   - 顶部导航栏（用户信息、设置等）
   - 响应式折叠（移动端适配）

2. src/views/Chat/ChatHome.vue - 默认欢迎页面
3. src/views/Chat/ChatConversation.vue - 具体聊天页面

4. src/components/Chat/ConversationList.vue - 会话列表
   - 显示聊天记录列表
   - 未读消息提示
   - 最后一条消息预览
   - 集成 useChatStore 状态

5. src/components/Chat/MessageList.vue - 消息列表
   - 消息气泡展示
   - 自动滚动到底部
   - 历史消息分页加载

6. src/components/Chat/MessageInput.vue - 消息输入
   - 文本输入框
   - 表情包按钮
   - 文件上传按钮
   - 发送按钮和Enter快捷键

集成已有的 chatStore、WebSocket管理，对接后端消息接口"
```

#### 好友管理页面
```
"实现社交功能页面：
项目位置：/testlinux/code/easy-chat-web

1. src/views/Social/Friends.vue - 好友列表页面
   - 好友列表展示（在线状态）
   - 搜索好友功能
   - 添加好友按钮
   - 好友操作菜单（聊天、删除）

2. src/views/Social/Groups.vue - 群组列表页面
   - 已加入群组列表
   - 创建群组功能
   - 群组信息展示

3. src/components/Social/FriendRequestList.vue - 好友请求
   - 收到的好友请求列表
   - 同意/拒绝操作
   - 发送的请求状态

4. src/components/Social/UserSearch.vue - 用户搜索
   - 搜索框和搜索结果
   - 用户信息卡片
   - 添加好友按钮

集成 useSocialStore，对接后端社交接口，使用Element Plus组件"
```

### 3. 组件级开发指令

#### 消息组件开发
```
"创建聊天消息相关组件：
项目位置：/testlinux/code/easy-chat-web/src/components/Chat/

1. MessageBubble.vue - 消息气泡组件
   Props:
   - message: 消息对象
   - isOwn: 是否为自己发送
   
   功能：
   - 支持文本、图片、文件消息类型
   - 消息状态显示（发送中、已送达、已读）
   - 消息时间显示（使用 formatTime 工具）
   - 右键菜单（复制、删除、引用）
   - 消息失败重发

2. MessageImage.vue - 图片消息组件
   - 图片预览和点击放大
   - 加载状态和失败处理
   - 支持多种图片格式

3. MessageFile.vue - 文件消息组件
   - 文件图标和信息显示
   - 下载功能
   - 文件大小格式化

样式要求：参考微信/QQ消息气泡设计，使用SCSS变量"
```

#### 输入组件增强
```
"增强消息输入功能：
修改 src/components/Chat/MessageInput.vue

新增功能：
1. 表情包选择器
   - 常用表情网格显示
   - 分类标签切换
   - 点击插入到光标位置

2. 文件上传处理
   - 拖拽上传支持
   - 文件类型验证
   - 上传进度显示
   - 图片预览功能

3. 快捷功能
   - @ 提及用户（自动补全）
   - 消息草稿自动保存
   - 快捷键支持（Ctrl+Enter发送）
   - 输入状态提示（正在输入...）

4. 集成WebSocket
   - 实时发送消息状态
   - 连接状态显示
   - 发送失败重试

使用Element Plus组件，集成已有的工具函数和store"
```

### 4. 功能增强指令

#### WebSocket实时功能
```
"完善WebSocket实时通信功能：
项目位置：/testlinux/code/easy-chat-web

1. 更新 src/utils/websocket.js
   - 与后端 ws://localhost:9001 建立连接
   - 实现消息收发协议对接
   - 添加用户在线状态同步
   - 消息推送和本地存储

2. 在聊天组件中集成WebSocket
   - 接收实时消息更新
   - 发送消息状态反馈
   - 用户输入状态同步
   - 连接状态UI提示

3. 通知系统
   - 新消息桌面通知
   - 声音提醒（可选）
   - 浏览器标题闪烁
   - 消息角标更新

4. 离线消息处理
   - 消息本地缓存
   - 重连后消息同步
   - 发送队列管理

基于现有的 chatStore 和 WebSocket管理器实现"
```

#### 主题和样式优化
```
"优化聊天应用的视觉体验：
项目位置：/testlinux/code/easy-chat-web

1. 主题系统完善
   - 明暗主题切换按钮
   - 主题色彩自定义
   - 用户偏好保存
   - 更新 src/styles/variables.scss

2. 响应式设计优化
   - 移动端适配改进
   - 触摸操作优化
   - 屏幕旋转适配
   - 小屏幕布局调整

3. 动画和过渡效果
   - 页面切换动画
   - 消息发送动画
   - 加载状态动画
   - 滚动优化

4. 无障碍支持
   - 键盘导航支持
   - 屏幕阅读器优化
   - 高对比度模式
   - 字体大小调节

使用CSS变量和SCSS，保持与Element Plus风格一致"
```

### 5. 后端对接和部署指令

#### API接口完整对接
```
"完善前后端API对接：
前端项目：/testlinux/code/easy-chat-web
后端项目：/testlinux/code/easy-chat

任务：
1. 更新 src/api/modules/ 下的API配置
   - 根据后端实际接口调整请求格式
   - 处理认证token传递
   - 统一响应数据格式处理

2. 测试核心功能接口
   - 用户登录注册流程
   - 消息发送接收
   - 好友操作
   - 文件上传

3. 错误处理完善
   - HTTP状态码处理
   - 业务错误码映射
   - 网络异常处理
   - 用户友好的错误提示

4. 开发环境配置
   - vite代理配置调整
   - 环境变量管理
   - 开发调试工具

确保前端能够与Go后端服务正常通信"
```

#### 生产部署准备
```
"准备聊天应用的生产部署：
项目位置：/testlinux/code/easy-chat-web

1. 构建优化
   - Vite生产构建配置优化
   - 代码分割和懒加载
   - 静态资源压缩
   - 环境变量生产配置

2. 性能优化
   - 组件懒加载
   - 图片懒加载和压缩
   - 消息列表虚拟滚动
   - 内存泄漏检查

3. 安全加固
   - XSS防护
   - CSRF保护
   - 敏感信息处理
   - 请求签名验证

4. 部署配置
   - Nginx配置示例
   - Docker容器化
   - CI/CD流程配置
   - 监控和日志配置

提供完整的部署文档和配置文件"
```

### 6. 调试和问题解决指令

#### 项目问题诊断
```
"诊断Vue3聊天项目的问题：
项目位置：/testlinux/code/easy-chat-web
问题描述：[具体描述遇到的问题]

请检查：
1. 控制台错误信息
2. 网络请求状态
3. 状态管理数据流
4. 组件渲染问题
5. 路由配置问题

提供解决方案和代码修复建议"
```

#### 性能优化分析
```
"分析聊天应用的性能问题：
项目位置：/testlinux/code/easy-chat-web

检查项目：
1. 组件渲染性能
2. 状态更新频率
3. 内存使用情况
4. 网络请求优化
5. 打包体积分析

提供优化建议和实现方案"
```

## 📁 关键文件和目录说明

### 核心配置文件
- `vite.config.js` - Vite配置，包含代理、别名、插件
- `package.json` - 依赖管理和脚本命令
- `.eslintrc.js` - 代码规范配置
- `src/main.js` - 应用入口文件

### 状态管理 (Pinia Stores)
- `src/stores/modules/user.js` - 用户状态（登录、用户信息）
- `src/stores/modules/chat.js` - 聊天状态（消息、会话）
- `src/stores/modules/social.js` - 社交状态（好友、群组）
- `src/stores/modules/app.js` - 应用状态（主题、通知）

### API接口封装
- `src/api/modules/user.js` - 用户相关API
- `src/api/modules/chat.js` - 聊天相关API  
- `src/api/modules/social.js` - 社交相关API
- `src/utils/request.js` - axios请求封装

### 工具函数
- `src/utils/websocket.js` - WebSocket连接管理
- `src/utils/time.js` - 时间格式化工具
- `src/utils/common.js` - 通用工具函数

### 样式系统
- `src/styles/variables.scss` - SCSS变量和主题
- `src/styles/index.scss` - 全局样式和工具类

## 🚀 快速开始命令

```bash
# 进入项目目录
cd /testlinux/code/easy-chat-web

# 安装依赖（首次）
npm install

# 启动开发服务器
npm run dev

# 代码检查和格式化
npm run lint
npm run format

# 生产构建
npm run build
```

## 💡 开发建议

### 1. 分阶段开发
- 先完成基础页面和路由
- 再实现核心聊天功能
- 最后添加高级特性

### 2. 保持代码质量
- 遵循已有的代码规范
- 及时运行lint检查
- 保持组件的可重用性

### 3. 测试和调试
- 使用浏览器开发工具
- 检查网络请求和响应
- 验证状态管理数据流

### 4. 与后端对接
- 先用Mock数据开发前端
- 再逐步对接真实API
- 处理异步和错误情况

## 🆘 常见问题解决

### WebSocket连接问题
```
"WebSocket连接失败，项目位于 /testlinux/code/easy-chat-web
检查 src/utils/websocket.js 的连接配置
确保后端 ws://localhost:9001 服务正常运行
提供连接调试和错误处理方案"
```

### API请求问题
```
"前端API请求失败，项目位于 /testlinux/code/easy-chat-web
检查 src/utils/request.js 的配置
确认后端 http://localhost:8888 接口可访问
提供请求调试和错误处理方案"
```

### 状态管理问题
```
"Pinia状态管理数据不更新，项目位于 /testlinux/code/easy-chat-web
检查 src/stores/modules/ 下的状态逻辑
提供状态调试和数据流分析方案"
```

---

**注意**: 这个文档会随着项目开发进展不断更新，请保持文档与实际代码的同步。