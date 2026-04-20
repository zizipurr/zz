import { expect, test } from "@playwright/test";

test("runtime replay should not emit uncaught errors", async ({ page }) => {
  test.setTimeout(120000);
  const runtimeErrors: string[] = [];

  page.on("pageerror", (err) => {
    runtimeErrors.push(`[pageerror] ${err.message}`);
  });

  page.on("console", (msg) => {
    const text = msg.text();
    if (
      msg.type() === "error" ||
      /Uncaught|TypeError|Cannot read properties|getLayer/i.test(text)
    ) {
      runtimeErrors.push(`[console:${msg.type()}] ${text}`);
    }
  });

  await page.goto("http://localhost:8000/#/login");
  await page.getByRole("textbox", { name: "请输入用户名或手机号" }).click();
  await page.getByRole("textbox", { name: "请输入用户名或手机号" }).fill("admin");
  await page.getByRole("textbox", { name: "请输入用户名或手机号" }).press("Tab");
  await page.getByRole("textbox", { name: "请输入密码" }).fill("admin");
  await page.getByRole("button", { name: "登 录" }).click();
  await expect(page.getByRole("button", { name: /告警中心/ })).toBeVisible({ timeout: 20000 });
  await page.getByText(/福田区\s+民生缴费平台/).first().click();
  await page.getByText(/网格员（.*）▾/).first().click();
  await page.getByText(/李网格员（南山区）/).first().click();
  await page.getByRole("button", { name: "确认派单" }).click();
  await page.getByRole("button", { name: "立即派单" }).click();
  await page.getByRole("button", { name: "确认派单" }).click();
  await page.getByRole("button", { name: "问 AI" }).click();
  await page.getByRole("textbox", { name: "请输入你想咨询的问题" }).click();
  await page.getByRole("textbox", { name: "请输入你想咨询的问题" }).fill("1");
  await page.getByRole("button", { name: "发送" }).click();
  await page.getByRole("button", { name: "✕" }).click();
  await page.getByRole("button", { name: "🎮" }).click();
  await page.getByRole("button", { name: "🎲 随机推送" }).click();
  await page.getByRole("button", { name: "告警中心" }).click();
  const cancelButton = page.getByRole("button", { name: "取消" });
  if (await cancelButton.isVisible()) {
    await cancelButton.click();
  } else {
    // 某些状态下告警中心为抽屉/无弹层，按 ESC 兜底避免遮挡后续点击
    await page.keyboard.press("Escape");
  }
  await page.getByRole("button", { name: /交通监控接口/ }).click();
  await page.getByRole("button", { name: "总览" }).click();
  await page.getByRole("button", { name: /智能路灯节点/ }).click();
  await page.getByRole("button", { name: /智能路灯节点/ }).click();
  await page.getByRole("button", { name: /监控网格节点/ }).click();
  await page.getByRole("button", { name: /智慧社区住户/ }).click();
  await page.getByRole("button", { name: "✕" }).click();
  await page.getByText(/今日值班.*在岗/).first().click();
  await page.getByText(/福田区美林小区管道漏水报修/).first().click();
  await page.getByRole("button", { name: "取消" }).click();
  await page.getByRole("button", { name: "智慧交通", exact: true }).click();
  await page.getByRole("button", { name: "城安应急", exact: true }).click();
  await page.getByRole("button", { name: "城安应急", exact: true }).click();
  await page.getByText("龙华区危化品运输异常告警").click();
  await page.getByRole("button", { name: "确认派单" }).click();
  await page.getByRole("button", { name: "城市服务", exact: true }).click();

  expect(runtimeErrors, runtimeErrors.join("\n")).toEqual([]);
});

