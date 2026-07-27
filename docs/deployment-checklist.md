# GlobalPush 部署检查清单

## 数据库与账号

- Vercel Production 的 `DATABASE_URL` 必须指向固定的 Neon 生产分支；Preview 使用独立分支。换分支或新建数据库后，旧账号不会自动出现。
- 不要运行 `prisma migrate reset`、`prisma db push --force-reset` 或删除 Neon 分支。正式部署使用 `npm run prisma:deploy`。
- 当前 `build:vercel` 会先执行 `prisma migrate deploy`。部署后在 Vercel 日志确认 `202607270001_launch_hardening` 已应用。
- `JWT_SECRET` 与 `VERIFICATION_CODE_SECRET` 在同一环境中必须长期固定。更换 `JWT_SECRET` 会让现有登录失效，更换验证码密钥会让尚未使用的验证码失效，但不会删除用户。

## 邮箱注册

- 配置 `RESEND_API_KEY` 和 `NOTIFICATION_FROM_EMAIL`；发件地址必须属于 Resend 已验证域名。
- 生产环境缺少 Resend 配置时会拒绝发送，不会伪装成功。Vercel 日志会记录邮件请求 ID或服务错误，但不记录验证码、密码或密钥。
- 部署后依次验证：发送验证码、错误验证码累计限制、正确验证码注册、登录、修改密码后旧会话失效。
- 若接口提示数据库结构未更新，先核对 Vercel 使用的 Neon 分支，再执行 `npm run prisma:deploy`；不要通过重建数据库解决。

## 服务端隐私

- 只有 `NEXT_PUBLIC_SITE_URL`、`NEXT_PUBLIC_BUSINESS_TZ`、`NEXT_PUBLIC_BUSINESS_TZ_LABEL` 可以进入浏览器包。
- Resend、R2、短信、JWT、Cron 等密钥禁止添加 `NEXT_PUBLIC_` 前缀，也不要写入仓库或前端请求体。
- 浏览器 Network 中看到 `/api/files/:id` 和已授权图片内容是正常的；不应出现 R2 endpoint、Access Key 或 Secret。

## 上线顺序

1. 配置 Neon、Resend、R2、固定 JWT 密钥和 `CRON_SECRET`。
2. 部署 Preview，验证注册、登录、资源上传、私有截图权限与询价状态流。
3. 运行 `npm run storage:migrate` 并处理失败清单。
4. 部署 Production，检查迁移日志与 `/api/cron/storage-cleanup` 的每日执行结果。
5. 确认旧钱包和充值申请仅可查看，任何充值/审批接口均返回 `410`。
