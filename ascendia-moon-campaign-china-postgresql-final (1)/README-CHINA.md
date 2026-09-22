# Ascendia 企业出海月相 H5｜CloudBase 中国版

## 中国版与原版的区别

- 页面、6 道题、月相动画、活动规则、Logo、二维码和 Lead Dashboard 全部保留。
- 网站和 API 部署到腾讯 CloudBase Run。
- 客户资料保存在 CloudBase PostgreSQL 的 `leads` 表。
- 管理员使用独立邮箱和强密码登录，登录态为 HttpOnly 签名 Cookie。
- 不依赖 Vercel、Supabase 或 Resend。
- 已修复 Safari 中“联系方式”竖排的问题。

## 部署前准备

1. 使用腾讯云中国站账号开通 CloudBase 免费体验环境。
2. 记下环境 ID。
3. 在“SQL 型数据库 → SQL 编辑器”运行 `cloudbase/postgresql-schema.sql`，创建 `leads` 表。
4. 访客不会直接连接数据库，提交统一由受保护的服务端接口完成。

## 部署

1. 在 CloudBase 控制台选择“云托管 / CloudBase Run”。
2. 新建服务，选择“从代码仓库部署”或上传本项目。
3. 构建方式选择 Dockerfile，端口填写 `3000`。
4. 配置以下环境变量：

| 名称 | 填写内容 |
| --- | --- |
| `BACKEND_PROVIDER` | `cloudbase` |
| `CLOUDBASE_ENV_ID` | CloudBase 环境 ID |
| `CLOUDBASE_API_KEY` | 刚创建并保存的服务端 API Key |
| `ADMIN_EMAIL` | `fiona.gu@ascendiaptrs.com` |
| `ADMIN_PASSWORD` | 独立的 12 位以上强密码 |
| `ADMIN_SESSION_SECRET` | 32 位以上随机字符串 |
| `RATE_LIMIT_SALT` | 另一条 32 位以上随机字符串 |
| `CAMPAIGN_ENABLED` | `true` |
| `NEXT_PUBLIC_APP_URL` | 首次可留空，部署后填正式地址再重新部署 |

在“API Key 配置”创建服务端 API Key，并将它保存为云端环境变量 `CLOUDBASE_API_KEY`。它拥有服务端权限，不得写入前端代码或公开仓库。

## 上线测试

1. 打开首页，完成全部 6 题。
2. 填写测试联系方式并提交。
3. 打开 `/admin/login`，使用 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 登录。
4. 确认测试 Lead 出现在后台。
5. 修改销售状态并刷新确认保存。
6. 点击“导出 CSV”。
7. 分别在 iPhone 微信、Android 微信和无 Wi-Fi 的移动网络测试。

## 邮件通知

中国版不再调用海外 Resend。当前以 Lead Dashboard 为准，提交数据不会因邮件服务失败而丢失。若需要邮件提醒，应在腾讯云邮件推送完成发信域名、模板和发信地址审核后，再接入腾讯云 SES；在审核完成前不应把客户资料转发到第三方海外邮件接口。

## 正式域名

免费体验环境适合活动测试。绑定 `moon.ascendiaptrs.com` 前，需要按腾讯云页面要求完成实名认证、域名归属验证以及必要的接入备案。不要修改 `ascendiaptrs.com` 主站记录，只新增 `moon` 子域名记录。
