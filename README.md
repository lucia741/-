# 智记 (ZhiNote) — 后端 API

> **纯后端项目**：不含前端 UI。请用 v0 / Cursor 等工具单独设计前端，对接本仓库 REST API。

## 功能

- 用户认证（注册 / 登录 / Cookie 会话）
- 笔记 CRUD + 标签 + 搜索
- 仪表盘统计
- 向量 RAG + 通义千问流式对话（阿里云百炼）
- 对话历史持久化

## 环境变量

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=随机32+字符
DASHSCOPE_API_KEY=sk-...
AI_MODEL=qwen-plus          # 可选
AI_RATE_LIMIT_PER_MIN=20    # 可选
```

```powershell
npm run setup      # 生成 SESSION_SECRET
npm run db:migrate # 初始化表 + pgvector
npm run dev        # http://localhost:3000
```

## API 一览

### 公开

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| POST | `/api/auth/register` | `{ email, password }` |
| POST | `/api/auth/login` | `{ email, password }` |

### 需登录（Cookie）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/logout` | 退出 |
| GET | `/api/auth/me` | 当前用户 |
| GET | `/api/notes?q=&tag=` | 笔记列表 |
| POST | `/api/notes` | `{ title, content?, tags? }` |
| GET/PUT/DELETE | `/api/notes/:id` | 单条笔记 |
| GET | `/api/tags` | 标签列表 |
| GET | `/api/dashboard` | 统计 |
| POST | `/api/chat` | AI 流式对话（AI SDK `messages` + `sessionId`） |
| GET/POST | `/api/chat/sessions` | 对话列表 / 新建 |
| GET/DELETE | `/api/chat/sessions/:id` | 对话详情 / 删除 |
| GET | `/api/chat/preview?q=` | RAG 检索预览 |

## 前端对接说明

1. 所有请求带 `credentials: "include"` 以携带 Cookie
2. AI 对话推荐使用 `@ai-sdk/react` 的 `useChat`，`api: "/api/chat"`
3. 请求体示例：`{ messages: [...], sessionId: "uuid" }`

## 项目结构

```
app/api/     # 全部 API 路由
lib/         # 业务逻辑（auth / db / ai / chat / notes）
drizzle/     # SQL 迁移
middleware.ts # API 鉴权
```

## 部署 Vercel

配置环境变量后 `vercel deploy`。根路径 `/` 仅显示 API 说明页。
