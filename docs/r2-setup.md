# Cloudflare R2 上线配置

## 1. 创建私有桶

1. 在 Cloudflare R2 创建 **Standard** 桶。生产使用 `globalpush-files-prod`，Preview 使用 `globalpush-files-preview`。
2. 不要启用 `r2.dev` 公共访问，也不要为桶绑定公开自定义域名。文件必须经过 `/api/files/:id` 的权限检查。
3. 创建只作用于对应桶的 `Object Read & Write` API Token。不要创建全账户管理员 Token。

## 2. 配置 Vercel

以下变量只能配置在 Vercel 服务端环境，名称不能加 `NEXT_PUBLIC_`：

```text
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
CRON_SECRET
```

分别给 Production 和 Preview 设置不同的 `R2_BUCKET_NAME` 与 Token。`CRON_SECRET` 使用至少 32 字节的随机值。浏览器只能得到本站文件 ID，不会得到 R2 Secret；但被授权用户实际看到的图片内容无法对该用户隐藏。

## 3. 免费额度保护

代码默认硬限制为：有效文件 8 GiB、每月写 800,000 次、源站读 8,000,000 次、每用户 200 MiB、每日 20 个或 40 MiB、单文件 4 MiB。配额数据库异常时上传会拒绝，不会降级为无限制上传。

Cloudflare 预算提醒只会通知，不会自动停止计费。请在 Cloudflare Billing 中设置低于可承受金额的提醒，并保持桶为私有，避免绕过应用层配额。R2 免费层和操作分类以 [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/) 的当前说明为准。

## 4. 部署与迁移

1. 先在 Preview 部署并上传、读取一张公开图和一张私有截图。
2. 执行数据库迁移：`npm run prisma:deploy`。
3. 配好 R2 变量后执行：`npm run storage:migrate`。脚本可重复执行，只处理仍是 HTTPS 外链的记录，失败项写入权限为 `0600` 的 `r2-migration-failures.json`。
4. 确认失败清单为空后，再移除旧图床资产。
5. Vercel Cron 每日清理超过 24 小时的失败/未完成上传，以及超过 7 天且未引用的头像和资源图。订单与付款凭证不会自动删除。

R2 Token 的官方配置步骤见 [Cloudflare API Token 文档](https://developers.cloudflare.com/r2/api/tokens/)。
