# Ascendia Partners｜中秋 × 国庆企业出海月相测试

这是 Ascendia Partners｜信宏咨询 2026 双节营销活动的独立 Next.js 项目。

- 不会读取、写入或修改 ascendiaptrs.com 的任何代码。
- 首次部署使用独立 HTTPS 地址，例如 ascendia-moon.vercel.app。
- 客户联系方式只会发送到服务端 API；不会写入 URL、前端源码或浏览器 localStorage。

## 项目结构

~~~
ascendia-moon-campaign/
├── app/
│   ├── page.tsx                    公开 H5 首页
│   ├── api/leads/route.ts          安全 Lead 提交接口
│   ├── api/admin/                  管理员登录、Lead、状态、CSV 接口
│   ├── admin/                      独立后台 /admin
│   └── opengraph-image.tsx         朋友圈/社交分享封面
├── components/
│   ├── campaign-experience.tsx     6 题 H5、联系表单、结果页
│   └── admin-dashboard.tsx         CRM 风格后台
├── lib/
│   ├── campaign-config.ts          题目、月相区间、规则、品牌活动文案
│   ├── reporting.ts                月相与服务推荐规则
│   ├── validation.ts               服务端输入校验
│   ├── admin-auth.ts               Supabase Auth + HttpOnly Cookie
│   ├── rate-limit.ts               反垃圾提交限流
│   └── email.ts                    Resend 邮件通知
├── public/assets/                  正式 Logo 与公众号二维码
├── supabase/schema.sql             数据库和 RLS 脚本
├── tests/                          月相和表单规则测试
└── .env.example                    环境变量名称（没有真实密钥）
~~~

## 先做两件事

1. Ascendia Partners 的原始官方 Logo 已放在：

   public/assets/ascendia-logo.jpg（原始文件）

   页面显示使用去白底版本 `public/assets/ascendia-logo-transparent.png`，原始 Logo 保留不覆盖。

   项目使用该原图，不擅自重绘、变形或重新着色。公众号二维码已直接采用现有正式原图：

   public/assets/ascendia/qrcode_for_gh_3854a77f8dbc_344.jpg

2. 准备 Supabase、Resend 和 Vercel 账户：它们分别负责安全存客户资料、邮件通知和公开部署网页。

## 本地运行

安装 Node.js LTS 后，在本项目文件夹运行：

~~~
npm install
cp .env.example .env.local
npm run dev
~~~

在浏览器打开：

~~~
http://localhost:3000
~~~

没有配置 Supabase 前，页面可以完整浏览和答题；最后提交 Lead 时会提示服务尚未配置完成。这是安全保护，不会假装保存客户资料。

自动规则测试：

~~~
npm test
~~~

生产构建前：

~~~
npm run lint
npm run typecheck
npm run build
~~~

## 环境变量

复制 .env.example 为 .env.local，再填入真实值。不要把 .env.local 提交到 Git。

| 变量 | 用途 | 是否可以出现在浏览器 |
| --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Supabase 项目 URL | 可以 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 公共 anon key；RLS 已限制权限 | 可以 |
| SUPABASE_SERVICE_ROLE_KEY | 服务端保存/管理 Lead 的密钥 | 不可以 |
| RESEND_API_KEY | 服务端邮件密钥 | 不可以 |
| EMAIL_FROM | 已在 Resend 验证的发件人 | 不可以 |
| LEAD_NOTIFY_EMAIL | 新 Lead 收件邮箱；默认 fiona.gu@ascendiaptrs.com | 不可以 |
| RATE_LIMIT_SALT | 用于短期 IP 哈希限流的随机长字符串 | 不可以 |
| CAMPAIGN_ENABLED | true 开启；false 停用公开活动和提交接口 | 不可以 |
| NEXT_PUBLIC_APP_URL | 部署后的独立 HTTPS 地址 | 可以 |
| ADMIN_BOOTSTRAP_EMAILS | 仅首次创建管理员的临时白名单；正式运行后可留空 | 不可以 |

## Supabase 设置

1. 到 Supabase 新建一个独立项目，例如 ascendia-moon-campaign。
2. 在 Project Settings → API 复制 Project URL、anon key 和 service role key。
3. 在 SQL Editor 完整运行 supabase/schema.sql。
4. 在 Authentication → Providers 保持 Email 登录开启；建议关闭公开注册。
5. 将 URL、anon key、service role key 加进 Vercel 环境变量。

schema.sql 已完成：

- leads 与 admin_users 都开启 RLS；
- 没有给普通访客任何读取或写入 leads 的 policy；
- Lead 仅由 Next.js 服务端使用 service role 写入；
- 管理员浏览器仅能调用验证登录态的 api/admin 路径。

## 创建管理员

1. 在 Supabase Authentication → Users → Add user 创建管理员邮箱与密码。
2. 复制该用户 UUID。
3. 在 SQL Editor 运行，替换管理员用户 UUID：

~~~
insert into public.admin_users (user_id, is_active)
values ('管理员用户 UUID', true)
on conflict (user_id) do update set is_active = true;
~~~

4. 登录地址：

~~~
https://你的独立域名/admin/login
~~~

5. 管理后台：

~~~
https://你的独立域名/admin
~~~

管理员登录使用 Supabase Auth；登录 token 保存在 HttpOnly、安全 Cookie 中，不放入 localStorage。

## Resend 邮件设置

1. 在 Resend 添加并验证发件域名。
2. 新建 API key，填入 RESEND_API_KEY。
3. 设置 EMAIL_FROM，例如 Ascendia Partners <leads@your-verified-domain.com>。
4. 保持 LEAD_NOTIFY_EMAIL=fiona.gu@ascendiaptrs.com。

Lead 会先写入数据库，再尝试发邮件；即使邮件失败，Lead 不会丢失，后台会显示 email_notification_status=failed。

## 独立部署到 Vercel

1. 把此文件夹推送到新的、独立 GitHub 仓库；不要放入现有官网仓库。
2. 在 Vercel 选择 Add New → Project，导入新仓库。
3. 在 Environment Variables 填入上方环境变量。
4. 点击 Deploy。
5. Vercel 会生成独立 HTTPS URL，例如：

~~~
https://ascendia-moon.vercel.app
~~~

6. 把最终 URL 填入 NEXT_PUBLIC_APP_URL 后重新部署。

本仓库还未连接你的 Vercel、Supabase、Resend 账号，因此不会假装给出一个不存在的线上 URL。完成上面的步骤后，Vercel 页面显示的 URL 就是最终线上地址；后台是该 URL 加 /admin。

## 以后绑定 moon.ascendiaptrs.com

这一步与首次部署分开：

1. 在 Vercel 项目 Domains 中添加 moon.ascendiaptrs.com。
2. 按 Vercel 显示的记录在域名 DNS 管理后台新增子域名记录。
3. 不修改 ascendiaptrs.com 主站代码，也不要改现有主站 DNS 记录。

## 常用修改位置

| 想修改什么 | 文件与位置 |
| --- | --- |
| 截止日期、品牌文案、通知邮箱默认值 | lib/campaign-config.ts 的 BRAND |
| 6 道题、选项、最多选择数量 | lib/campaign-config.ts 的 QUESTIONS |
| 新月/上弦/盈月/满月区间与文案 | lib/campaign-config.ts 的 MOON_PHASES |
| 服务推荐匹配逻辑 | COMPLETION_SERVICE_MAP 与 PAIN_POINT_SERVICE_MAP |
| 高意向时间判断 | HIGH_INTENT_TIMELINES |
| 8 折、¥20,000、月饼礼盒、活动规则 | components/campaign-experience.tsx 的 CampaignBenefits |
| 替换官方 Logo | public/assets/ascendia-logo.jpg |
| 替换二维码 | 替换 public/assets/ascendia/qrcode_for_gh_3854a77f8dbc_344.jpg，名称保持不变 |
| 改通知邮箱 | Vercel 的 LEAD_NOTIFY_EMAIL |
| 导出客户 CSV | 登录 /admin，点击右上角 导出 CSV |
| 立即停用活动 | Vercel 环境变量改为 CAMPAIGN_ENABLED=false 后 Redeploy |

## 微信朋友圈分享

1. 使用 Vercel 部署后的首页 HTTPS URL；不要使用 localhost。
2. 将 URL 复制到微信聊天或朋友圈，用户点击即进入测试首页。
3. 项目已有标准 title、description 和 Open Graph 分享封面，微信通常会据此生成网页卡片。
4. 如需自定义朋友圈标题与缩略图，在公众号后台将独立域名加入 JS 接口安全域名，并另行增加安全的服务端签名接口。当前 H5 不依赖微信 JS-SDK，因此未配置时仍可以正常打开、答题、提交与显示二维码。
5. 上线前请在 iPhone 微信、Android 微信、Chrome Desktop 各测试一次。

## 安全与反垃圾

- 不保存原始 IP；短期限流只保存带 secret 的 IP 哈希；
- 有 honeypot、最短填写时间、服务端校验、request_id 唯一约束；
- 提交时按钮锁定，避免重复点击；
- 不在 URL、localStorage、前端源码或 API Response 中暴露其他客户资料；
- API key 与 service role key 只在 Vercel 服务端环境变量中使用；
- 多区域高流量生产环境，请把 lib/rate-limit.ts 的内存限流替换为 Upstash Redis 或 Vercel KV。

## 上线前测试清单

- Q1 最多 3 个市场，暂未确定为排他项；
- Q5 最多 2 项；
- 所有单选、前进、返回与修改；
- Q4 点亮/取消后的月亮和月相；
- 联系方式、同意 checkbox、手机/微信格式校验；
- 重复点击提交不产生重复 Lead；
- 邮件失败时后台仍能看到 Lead；
- /admin 未登录不可读，登录后可查看、筛选、更新状态、导出 CSV；
- 微信 iOS、微信 Android、iPhone Safari、Chrome、Edge、Firefox；
- 320、375、390、430px 无横向溢出。
