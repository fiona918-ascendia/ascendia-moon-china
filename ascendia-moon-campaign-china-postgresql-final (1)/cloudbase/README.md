# CloudBase 中国版初始化

1. 创建一个 CloudBase PostgreSQL 环境，在 SQL 编辑器运行 `cloudbase/postgresql-schema.sql`。
2. 公开访客不直接读写数据表，所有提交通过本项目服务端 API 完成。
3. 使用项目根目录的 `Dockerfile` 部署到 CloudBase 云托管/CloudBase Run，容器端口为 `3000`。
4. 配置环境变量：

```text
BACKEND_PROVIDER=cloudbase
CLOUDBASE_ENV_ID=你的环境ID
CLOUDBASE_API_KEY=刚创建并保存的服务端APIKey
ADMIN_EMAIL=fiona.gu@ascendiaptrs.com
ADMIN_PASSWORD=请设置一个至少12位的独立强密码
ADMIN_SESSION_SECRET=请设置一个至少32位的随机字符串
CAMPAIGN_ENABLED=true
RATE_LIMIT_SALT=请设置另一个至少32位的随机字符串
NEXT_PUBLIC_APP_URL=部署后地址
```

在“API Key 配置”创建服务端 API Key，并仅通过环境变量 `CLOUDBASE_API_KEY` 保存。不要把该值写入代码、上传 Git 或暴露在浏览器中。

中国版默认不调用 Resend。Lead 会先保存进 CloudBase 数据库，并可在 `/admin` 查看和导出。若未来接入腾讯云邮件推送，可在保存成功后增加国内邮件通知适配器。
