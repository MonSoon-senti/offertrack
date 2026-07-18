# OfferTrack · 秋招进度管理

一个 **local-first** 的应届秋招进度管理工具：投递管道 Kanban + 笔试面试倒计时 + 每周备战打卡 + 月度总结。纯静态、零依赖，数据只保存在浏览器 `localStorage`，可直接部署到 GitHub Pages。

## 功能

- **投递进度追踪**：待投递 → 已投递 → 笔试 → 面试 → Offer → 已结束 六阶段看板，卡片一键推进/回退，点击编辑详情
- **阶段漏斗**：一格一公司，直观看到每个环节的积压
- **近期笔试 / 面试**：按日期排序的倒计时条，3 天内自动高亮
- **每周备战打卡**：周一至周日的周目标清单，全勤周 streak
- **本月进度总结**：当月各周完成格点、全勤周数、月完成率
- **导出 / 导入备份**：JSON 一键导出、随时恢复（换浏览器/换电脑必备）

## 本地运行

无需构建，任选其一：

```bash
npm run dev            # → http://127.0.0.1:7100/ （可传 --port / --host）
# 或
python -m http.server 7100
```

也可以直接双击 `index.html` 打开（PWA 安装与离线缓存需要 http(s) 环境才生效）。

## 部署到 GitHub Pages

1. 新建一个 GitHub 仓库（例如 `offertrack`）
2. 把本目录所有文件推送到 `main` 分支：

   ```bash
   git init
   git add .
   git commit -m "OfferTrack v0.1"
   git branch -M main
   git remote add origin git@github.com:<你的用户名>/offertrack.git
   git push -u origin main
   ```

3. 仓库 **Settings → Pages → Build and deployment**：
   - Source 选 **Deploy from a branch**
   - Branch 选 **main** / **/(root)**
4. 等 1–2 分钟，访问 `https://<你的用户名>.github.io/offertrack/`

> 仓库已含 `.nojekyll`，无需额外配置。若使用自定义域名，在 Pages 设置里填域名即可。

## 数据说明

- 所有数据保存在**当前浏览器的 localStorage**，不上传任何服务器
- 清浏览器数据会丢记录 → 请定期点页面右上角「**导出备份**」
- 首次打开内置 5 条「示例·」公司便于熟悉操作，点「清空示例」即可开始

## 技术

- 纯 HTML / CSS / JavaScript，零框架、零构建、零外部依赖（可离线）
- PWA：`manifest.webmanifest` + `sw.js`（HTTP(S) 下可"添加到主屏幕"）
- 图标为矢量 `icon.svg`；如需 PNG 版（例如 iOS 主屏幕图标）可运行 `tools/make-icons.py` 生成（需要 Pillow）

## Roadmap 想法

- [ ] 账号与云同步（Supabase / LeanCloud）
- [ ] Offer 对比卡（薪资 / 城市 / 匹配度打分）
- [ ] 每周复盘自动生成
- [ ] 数据洞察（转化率、投递节奏）
