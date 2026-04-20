# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\runtime-replay.spec.ts >> runtime replay should not emit uncaught errors
- Location: e2e\runtime-replay.spec.ts:3:1

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '立即派单' })
    - locator resolved to <button disabled type="button" class="_aiBtnPrimary_gxopy_539">立即派单</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    158 × waiting for element to be visible, enabled and stable
        - element is not enabled
      - retrying click action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: Z
        - generic [ref=e10]: 智城云
      - generic [ref=e11]: 区县级 IOC 驾驶舱
    - generic [ref=e12]:
      - button "全局 ▾" [ref=e15] [cursor=pointer]:
        - generic [ref=e16]: 全局
        - generic [ref=e17]: ▾
      - generic [ref=e18]:
        - img [ref=e19]
        - text: 23°C
      - generic [ref=e21]: 14:22:30
      - button "切换亮色模式" [ref=e22] [cursor=pointer]:
        - img [ref=e23]
      - button "告警中心 10" [ref=e29] [cursor=pointer]:
        - text: 告警中心
        - generic [ref=e30]: "10"
  - generic [ref=e31]:
    - button "总览" [ref=e32] [cursor=pointer]
    - button "智慧社区" [ref=e33] [cursor=pointer]
    - button "城安应急" [ref=e34] [cursor=pointer]
    - button "智慧交通" [ref=e35] [cursor=pointer]
    - button "城市服务" [ref=e36] [cursor=pointer]
  - generic [ref=e38]:
    - generic [ref=e39]:
      - button "监控网格节点 2,847 全局" [ref=e40] [cursor=pointer]:
        - generic [ref=e41]:
          - img [ref=e43]
          - generic [ref=e49]: 监控网格节点
        - generic [ref=e51]: 2,847
        - generic [ref=e53]: 全局
      - button "智能路灯节点 15,420 全局" [ref=e54] [cursor=pointer]:
        - generic [ref=e55]:
          - img [ref=e57]
          - generic [ref=e63]: 智能路灯节点
        - generic [ref=e65]: 15,420
        - generic [ref=e67]: 全局
      - button "智慧社区住户 28,614 户 全局" [ref=e68] [cursor=pointer]:
        - generic [ref=e69]:
          - img [ref=e71]
          - generic [ref=e77]: 智慧社区住户
        - generic [ref=e78]:
          - generic [ref=e79]: 28,614
          - generic [ref=e80]: 户
        - generic [ref=e82]: 全局
      - button "交通监控接口 156 全局" [ref=e83] [cursor=pointer]:
        - generic [ref=e84]:
          - img [ref=e86]
          - generic [ref=e92]: 交通监控接口
        - generic [ref=e94]: "156"
        - generic [ref=e96]: 全局
      - button "应急事件 10 件 全局" [ref=e97] [cursor=pointer]:
        - generic [ref=e98]:
          - img [ref=e100]
          - generic [ref=e102]: 应急事件
        - generic [ref=e103]:
          - generic [ref=e104]: "10"
          - generic [ref=e105]: 件
        - generic [ref=e107]: 全局
    - generic [ref=e108]:
      - generic [ref=e109]:
        - generic [ref=e110]:
          - generic [ref=e111]:
            - generic [ref=e112]: 事件聚合中心
            - generic [ref=e114] [cursor=pointer]: 全部 →
          - generic [ref=e115]:
            - generic [ref=e116] [cursor=pointer]:
              - generic [ref=e118]:
                - generic [ref=e119]: 交通信号灯异常
                - generic [ref=e120]: 福田区 T-087 · 14:19
              - generic [ref=e121]: 待处理
            - generic [ref=e122] [cursor=pointer]:
              - generic [ref=e124]:
                - generic [ref=e125]: 越秀区管道破裂
                - generic [ref=e126]: 越秀区 Y-012 · 14:15
              - generic [ref=e127]: 处理中
            - generic [ref=e128] [cursor=pointer]:
              - generic [ref=e130]:
                - generic [ref=e131]: 福田区水电缴费平台访问异常
                - generic [ref=e132]: 福田区 民生缴费平台 · 14:12
              - generic [ref=e133]: 处理中
            - generic [ref=e134] [cursor=pointer]:
              - generic [ref=e136]:
                - generic [ref=e137]: 龙华区政务中心热线响应超时
                - generic [ref=e138]: 龙华区 政务中心 · 14:12
              - generic [ref=e139]: 待处理
            - generic [ref=e140] [cursor=pointer]:
              - generic [ref=e142]:
                - generic [ref=e143]: 南山区滨海大道严重拥堵预警
                - generic [ref=e144]: 南山区 滨海大道 · 14:12
              - generic [ref=e145]: 处理中
            - generic [ref=e146] [cursor=pointer]:
              - generic [ref=e148]:
                - generic [ref=e149]: 福田区深南大道信号灯故障
                - generic [ref=e150]: 福田区 深南大道 · 14:12
              - generic [ref=e151]: 待处理
            - generic [ref=e152] [cursor=pointer]:
              - generic [ref=e154]:
                - generic [ref=e155]: 龙华区危化品运输异常告警
                - generic [ref=e156]: 龙华区 临时检查点 · 14:12
              - generic [ref=e157]: 处理中
            - generic [ref=e158] [cursor=pointer]:
              - generic [ref=e160]:
                - generic [ref=e161]: 宝安区G-042排水管网溢出预警
                - generic [ref=e162]: 宝安区 G-042 · 14:12
              - generic [ref=e163]: 处理中
            - generic [ref=e164] [cursor=pointer]:
              - generic [ref=e166]:
                - generic [ref=e167]: 福田区美林小区管道漏水报修
                - generic [ref=e168]: 福田区 美林小区 · 14:12
              - generic [ref=e169]: 处理中
            - generic [ref=e170] [cursor=pointer]:
              - generic [ref=e172]:
                - generic [ref=e173]: 南山区花园小区3栋电梯故障
                - generic [ref=e174]: 南山区 花园小区 3栋 · 14:12
              - generic [ref=e175]: 待处理
        - generic [ref=e176]:
          - generic [ref=e177]:
            - generic [ref=e178]: 消息中心
            - generic [ref=e179]:
              - generic [ref=e180]: 6 未读
              - generic [ref=e181] [cursor=pointer]: 全部已读
          - generic [ref=e182]:
            - generic [ref=e183] [cursor=pointer]:
              - generic [ref=e185]: 福田区 福田区 T-087 发生中危事件，请关注
              - generic [ref=e186]: 14:19
            - generic [ref=e187] [cursor=pointer]:
              - generic [ref=e189]: 事件已派单给 李网格员，请跟进进度
              - generic [ref=e190]: 14:19
            - generic [ref=e191] [cursor=pointer]:
              - generic [ref=e193]: 事件已派单给 张网格员，请跟进进度
              - generic [ref=e194]: 14:15
            - generic [ref=e195] [cursor=pointer]:
              - generic [ref=e197]: 事件已派单给 李网格员，请跟进进度
              - generic [ref=e198]: 14:15
            - generic [ref=e199] [cursor=pointer]:
              - generic [ref=e201]: 智城云系统已就绪，所有模块运行正常
              - generic [ref=e202]: 14:12
      - generic [ref=e203]:
        - generic [ref=e204]:
          - button "智慧交通 —" [ref=e205] [cursor=pointer]:
            - img [ref=e207]
            - generic [ref=e211]: 智慧交通
            - generic [ref=e212]: —
          - button "智慧社区 —" [ref=e213] [cursor=pointer]:
            - img [ref=e215]
            - generic [ref=e219]: 智慧社区
            - generic [ref=e220]: —
          - button "城安应急 —" [ref=e221] [cursor=pointer]:
            - img [ref=e223]
            - generic [ref=e228]: 城安应急
            - generic [ref=e229]: —
          - button "城市服务 —" [ref=e230] [cursor=pointer]:
            - img [ref=e232]
            - generic [ref=e234]: 城市服务
            - generic [ref=e235]: —
        - generic [ref=e239]:
          - generic:
            - generic [ref=e240]:
              - generic [ref=e242]:
                - generic:
                  - generic [ref=e245]: 5 公里
                  - generic [ref=e250]: 5 英里
              - generic [ref=e254]:
                - link [ref=e255] [cursor=pointer]:
                  - /url: http://map.qq.com?ref=jsapi_v3
                  - img [ref=e256]
                - generic [ref=e257]: ©2026 Tencent - GS(2026)1190号
            - generic [ref=e258]:
              - generic [ref=e260]:
                - img [ref=e263]
                - generic:
                  - img [ref=e265]
                  - img [ref=e267]
                  - img [ref=e269]
                  - img [ref=e271]
              - generic [ref=e274]:
                - img [ref=e276]
                - img [ref=e279]
        - generic [ref=e280]:
          - generic [ref=e282]: 事件趋势（近7日）
          - generic [ref=e287]: 工单处置率
      - generic [ref=e291]:
        - generic [ref=e292]:
          - generic [ref=e293]:
            - generic [ref=e294]: 总览
            - generic [ref=e296] [cursor=pointer]: 进入 →
          - generic [ref=e297]:
            - generic [ref=e298]:
              - generic [ref=e299]: "24"
              - generic [ref=e300]: 网格数
            - generic [ref=e301]:
              - generic [ref=e302]: "138"
              - generic [ref=e303]: 网格员
            - generic [ref=e304]:
              - generic [ref=e305]: "4"
              - generic [ref=e306]: 待处理事件
            - generic [ref=e307]:
              - generic [ref=e308]: 96%
              - generic [ref=e309]: 满意度
        - generic [ref=e310]:
          - generic [ref=e311]:
            - generic [ref=e312]: AI 智能助手
            - generic [ref=e314]:
              - generic [ref=e315]: ●
              - text: 在线
          - generic "🤖 当前区域无高危告警，系统运行正常。" [ref=e317]
          - generic [ref=e318]:
            - button "立即派单" [disabled] [ref=e319]
            - button "问 AI" [ref=e320] [cursor=pointer]
        - generic [ref=e321]:
          - generic [ref=e322]:
            - generic [ref=e323]: 实时告警
            - generic [ref=e325]: 3 条高危
          - generic:
            - generic [ref=e328] [cursor=pointer]:
              - generic [ref=e329]: 越秀区管道破裂
              - generic [ref=e330]: 越秀区 Y-012
            - generic [ref=e333] [cursor=pointer]:
              - generic [ref=e334]: 龙华区危化品运输异常告警
              - generic [ref=e335]: 龙华区 临时检查点
            - generic [ref=e338] [cursor=pointer]:
              - generic [ref=e339]: 宝安区G-042排水管网溢出预警
              - generic [ref=e340]: 宝安区 G-042
    - button "🎮" [ref=e341] [cursor=pointer]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("runtime replay should not emit uncaught errors", async ({ page }) => {
  4  |   test.setTimeout(120000);
  5  |   const runtimeErrors: string[] = [];
  6  | 
  7  |   page.on("pageerror", (err) => {
  8  |     runtimeErrors.push(`[pageerror] ${err.message}`);
  9  |   });
  10 | 
  11 |   page.on("console", (msg) => {
  12 |     const text = msg.text();
  13 |     if (
  14 |       msg.type() === "error" ||
  15 |       /Uncaught|TypeError|Cannot read properties|getLayer/i.test(text)
  16 |     ) {
  17 |       runtimeErrors.push(`[console:${msg.type()}] ${text}`);
  18 |     }
  19 |   });
  20 | 
  21 |   await page.goto("http://localhost:8000/#/login");
  22 |   await page.getByRole("textbox", { name: "请输入用户名或手机号" }).click();
  23 |   await page.getByRole("textbox", { name: "请输入用户名或手机号" }).fill("admin");
  24 |   await page.getByRole("textbox", { name: "请输入用户名或手机号" }).press("Tab");
  25 |   await page.getByRole("textbox", { name: "请输入密码" }).fill("admin");
  26 |   await page.getByRole("button", { name: "登 录" }).click();
  27 |   await expect(page.getByRole("button", { name: /告警中心/ })).toBeVisible({ timeout: 20000 });
  28 |   await page.getByText(/福田区\s+民生缴费平台/).first().click();
  29 |   await page.getByText(/网格员（.*）▾/).first().click();
  30 |   await page.getByText(/李网格员（南山区）/).first().click();
  31 |   await page.getByRole("button", { name: "确认派单" }).click();
> 32 |   await page.getByRole("button", { name: "立即派单" }).click();
     |                                                    ^ Error: locator.click: Test timeout of 120000ms exceeded.
  33 |   await page.getByRole("button", { name: "确认派单" }).click();
  34 |   await page.getByRole("button", { name: "问 AI" }).click();
  35 |   await page.getByRole("textbox", { name: "请输入你想咨询的问题" }).click();
  36 |   await page.getByRole("textbox", { name: "请输入你想咨询的问题" }).fill("1");
  37 |   await page.getByRole("button", { name: "发送" }).click();
  38 |   await page.getByRole("button", { name: "✕" }).click();
  39 |   await page.getByRole("button", { name: "🎮" }).click();
  40 |   await page.getByRole("button", { name: "🎲 随机推送" }).click();
  41 |   await page.getByRole("button", { name: "告警中心" }).click();
  42 |   const cancelButton = page.getByRole("button", { name: "取消" });
  43 |   if (await cancelButton.isVisible()) {
  44 |     await cancelButton.click();
  45 |   } else {
  46 |     // 某些状态下告警中心为抽屉/无弹层，按 ESC 兜底避免遮挡后续点击
  47 |     await page.keyboard.press("Escape");
  48 |   }
  49 |   await page.getByRole("button", { name: /交通监控接口/ }).click();
  50 |   await page.getByRole("button", { name: "总览" }).click();
  51 |   await page.getByRole("button", { name: /智能路灯节点/ }).click();
  52 |   await page.getByRole("button", { name: /智能路灯节点/ }).click();
  53 |   await page.getByRole("button", { name: /监控网格节点/ }).click();
  54 |   await page.getByRole("button", { name: /智慧社区住户/ }).click();
  55 |   await page.getByRole("button", { name: "✕" }).click();
  56 |   await page.getByText(/今日值班.*在岗/).first().click();
  57 |   await page.getByText(/福田区美林小区管道漏水报修/).first().click();
  58 |   await page.getByRole("button", { name: "取消" }).click();
  59 |   await page.getByRole("button", { name: "智慧交通", exact: true }).click();
  60 |   await page.getByRole("button", { name: "城安应急", exact: true }).click();
  61 |   await page.getByRole("button", { name: "城安应急", exact: true }).click();
  62 |   await page.getByText("龙华区危化品运输异常告警").click();
  63 |   await page.getByRole("button", { name: "确认派单" }).click();
  64 |   await page.getByRole("button", { name: "城市服务", exact: true }).click();
  65 | 
  66 |   expect(runtimeErrors, runtimeErrors.join("\n")).toEqual([]);
  67 | });
  68 | 
  69 | 
```