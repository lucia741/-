# 智记 (ZhiNote) — AI 智能笔记知识库

> 和自己的知识库聊天：创建笔记、标签分类，并通过 AI 针对你的笔记提问与总结。

## 技术栈

- **Next.js 16** — App Router + API Routes
- **Neon** — Serverless PostgreSQL
- **Drizzle ORM** — 类型安全的数据库访问
- **JWT Cookie** — 会话认证（bcrypt 密码加密）
- **Vercel AI SDK + AI Gateway** — 基于笔记的流式问答（RAG 简化版）

## 快速开始

### 1. 配置环境变量

```powershell
cd zhinote
copy .env.example .env.local
```

编辑 `.env.local`，填入 Neon 的 `DATABASE_URL`、随机 `SESSION_SECRET`，以及 `AI_GATEWAY_API_KEY`。

### 2. 初始化数据库

在 Neon SQL Editor 中执行 `drizzle/0000_init.sql`，或使用 Drizzle Kit：

```powershell
npm run db:push
```

### 3. 启动开发服务器

```powershell
npm install
npm run dev
```

访问 http://localhost:3000

## API 接口

所有受保护接口需登录（httpOnly Cookie 自动携带）。

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 `{ email, password }` |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 退出 |
| GET | `/api/auth/me` | 当前用户 |

### 笔记

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notes?q=&tag=` | 列表 / 关键词搜索 / 标签筛选 |
| POST | `/api/notes` | 创建 `{ title, content?, tags? }` |
| GET | `/api/notes/:id` | 单条详情 |
| PUT | `/api/notes/:id` | 更新 |
| DELETE | `/api/notes/:id` | 删除 |

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tags` | 标签列表（含笔记数） |
| GET | `/api/dashboard` | 仪表盘统计 + 最近编辑 |

### AI 对话

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | 基于笔记问答，**流式返回** `{ message, history? }` |
| GET | `/api/chat/preview?q=` | 预览检索到的笔记（调试 RAG，不消耗 AI 额度） |

**POST /api/chat 示例：**

```json
{
  "message": "我关于项目管理的笔记讲了什么？",
  "history": [
    { "role": "user", "content": "上一句问题" },
    { "role": "assistant", "content": "上一句回答" }
  ]
}
```

响应为 AI SDK UI Message Stream，阶段 3 前端可用 `@ai-sdk/react` 的 `useChat` 直接对接。

## 安全设计

- 所有笔记/标签查询均按 `user_id` 过滤，用户只能访问自己的数据
- 密码 bcrypt 加密存储
- 会话 token 存 httpOnly Cookie，前端 JS 无法读取

## 开发路线

- [x] **阶段 1** — 数据库 + 认证 + 笔记 CRUD
- [x] **阶段 2** — AI 对话（RAG 简化版 + 流式返回）
- [ ] **阶段 3** — 前端界面（v0 + Cursor）
- [ ] **阶段 4** — 联调部署 Vercel

## 项目结构

```
zhinote/
├── app/api/          # REST API 路由
├── lib/
│   ├── ai/           # RAG 检索、Prompt 构建、模型配置
│   ├── auth/         # 密码、会话、鉴权
│   ├── db/           # Drizzle schema + 连接
│   └── notes/        # 笔记业务逻辑
└── drizzle/          # SQL 迁移文件
```
