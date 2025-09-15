# 测试和运行指南

## 快速启动

1. 安装依赖:
```bash
cd /testlinux/code/easy-chat-web
npm install
```

2. 启动开发服务器:
```bash
npm run dev
```

3. 访问地址: http://localhost:3000

## 功能测试

### 已完成功能
- ✅ 登录页面 `/login`
- ✅ 注册页面 `/register`  
- ✅ 聊天首页 `/chat`
- ✅ 路由守卫和状态管理

### 测试流程
1. 访问 http://localhost:3000 会自动重定向到 `/chat`
2. 未登录用户会被重定向到 `/login`
3. 可以点击"立即注册"跳转到注册页面
4. 注册成功后自动跳转到聊天页面
5. 登录成功后也会跳转到聊天页面

### API对接
- 登录接口: `POST /v1/user/login`
- 注册接口: `POST /v1/user/register`
- 获取用户信息: `GET /v1/user/user`

确保后端服务在 http://localhost:8888 运行。

### 当前页面状态
- 登录/注册页面: ✅ 完成，包含表单验证和错误处理
- 聊天页面: 📝 基础占位符，显示用户信息和退出功能
- 其他页面: 📝 基础占位符

## 下一步开发
参考 DEV.md 中的详细指令继续开发聊天界面和其他功能。