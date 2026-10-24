<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Travel · 行境

智能旅游规划应用：React + Vite 前端 + Spring Boot 后端（`ai-agent/`）。

## 目录与仓库边界

| 路径 | 说明 | Git 仓库 |
|---|---|---|
| `src/`、`index.html`、`vite.config.ts` 等 | 前端（React 19 + Vite） | 根仓库 `D:\桌面\Travel\.git` |
| `ai-agent/` | 后端（Spring Boot 3 + Spring AI） | 独立仓库 `ai-agent/.git`（嵌入式仓库） |

> ⚠️ 仓库边界说明（对应问题清单 E53）：根仓库**不会**跟踪 `ai-agent/` 内的任何文件。
> 因此对后端的改动必须在 `ai-agent/` 目录内单独提交，否则会造成提交遗漏。

## 后端运行（ai-agent）

**Prerequisites:** JDK 21、Maven、MySQL、Redis（可选，用于缓存）、PostgreSQL + pgvector（可选，用于 RAG）。

```bash
cd ai-agent
# 1) 先执行数据库脚本
#    src/main/resources/db/*.sql（含 notification.sql）
# 2) 配置环境变量后启动
mvn spring-boot:run
```

### 必需/可选环境变量

| 变量 | 必需 | 说明 |
|---|---|---|
| `JWT_SECRET` | 建议 | JWT 签名密钥（≥32 字符） |
| `PEXELS_API_KEY` | 可选 | 图片搜索；缺失时自动降级为占位图 |
| `AMAP_MAPS_API_KEY` | 可选 | 高德逆地理编码 |
| `ALIYUN_OSS_KEY_ID` / `ALIYUN_OSS_KEY_SECRET` / `ALIYUN_OSS_BUCKET` / `ALIYUN_OSS_DOMAIN` | 可选 | 头像上传；缺失时应用仍可启动 |
| `CORS_ALLOWED_ORIGINS` | 可选 | 允许跨域来源，逗号分隔；默认仅本地开发地址 |

> 🔐 安全提示：本项目所有第三方密钥一律通过环境变量注入，**禁止硬编码进源码**。
> 历史提交中曾泄露过 Pexels API Key，请到 Pexels 控制台**轮换**该 Key。

## 前端运行

**Prerequisites:** Node.js

```bash
npm install
npm run dev      # 开发
npm run lint     # tsc --noEmit（已开启 strict 系列开关）
npm run build    # 生产构建
```

前端通过 `VITE_API_BASE_URL` 指定后端地址（默认 `http://localhost:8123/api`）。
生产构建请在 `.env` 或 CI 中显式设置，避免连到错误环境。
