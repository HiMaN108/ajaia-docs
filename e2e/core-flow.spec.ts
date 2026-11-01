import { expect, test, type Page } from "@playwright/test";

/**
 * The main reviewer journey, end to end in a real browser:
 * login → create → rich-text edit → autosave → reload (persistence) → share → collaborator sees it read-only.
 * Also captures the screenshots used in the README.
 */

async function loginAs(page: Page, email: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(email) }).click();
  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login/);
}

test("create, format, persist, share, and view as collaborator", async ({ page }) => {
  await page.goto("/login");
  await page.screenshot({ path: "screenshots/01-login.png" });

  // --- Alice creates and formats a document
  await loginAs(page, "alice@ajaia.dev");
  await expect(page.getByText("Owned by me")).toBeVisible();
  await page.screenshot({ path: "screenshots/02-dashboard-alice.png" });

  await page.getByRole("button", { name: /New document/ }).click();
  await expect(page).toHaveURL(/\/doc\//);

  const title = page.getByLabel("Document title");
  await title.fill("E2E Launch Plan");
  await title.press("Enter");

  const body = page.getByLabel("Document body");
  await body.click();
  await page.getByLabel("Text style").selectOption("h1");
  await page.keyboard.type("Launch Plan");
  await page.keyboard.press("Enter");
  await page.keyboard.type("This is ");
  await page.keyboard.press("ControlOrMeta+b");
  await page.keyboard.type("important");
  await page.keyboard.press("ControlOrMeta+b");
  await page.keyboard.type(" and ");
  await page.keyboard.press("ControlOrMeta+u");
  await page.keyboard.type("underlined");
  await page.keyboard.press("ControlOrMeta+u");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Bulleted list" }).click();
  await page.keyboard.type("First item");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second item");

  await expect(page.getByText("All changes saved")).toBeVisible();
  await page.screenshot({ path: "screenshots/03-editor-formatting.png" });

  // --- Reload: title, content and formatting persisted
  await page.reload();
  await expect(page.getByLabel("Document title")).toHaveValue("E2E Launch Plan");
  await expect(body.locator("h1")).toHaveText("Launch Plan");
  await expect(body.locator("strong")).toHaveText("important");
  await expect(body.locator("u")).toHaveText("underlined");
  await expect(body.locator("ul > li")).toHaveCount(2);

  // --- Export to Markdown
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download .md" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("E2E Launch Plan.md");
  const md = await (await download.createReadStream()).toArray();
  expect(Buffer.concat(md).toString()).toContain("# Launch Plan\n\nThis is **important** and <u>underlined</u>\n\n- First item\n- Second item");

  // --- Share with Bob as viewer
  await page.getByRole("button", { name: "Share" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Email address").fill("nobody@ajaia.dev");
  await dialog.getByLabel("Access level").selectOption("viewer");
  await dialog.getByRole("button", { name: "Share", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("No user found");

  await dialog.getByLabel("Email address").fill("bob@ajaia.dev");
  await dialog.getByRole("button", { name: "Share", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("Bob Editor can now view");
  await expect(dialog.getByText("bob@ajaia.dev", { exact: true })).toBeVisible();
  await page.screenshot({ path: "screenshots/04-share-dialog.png" });
  await dialog.getByRole("button", { name: "Close" }).click();

  await page.goto("/");
  await logout(page);

  // --- Bob sees it under "Shared with me", read-only
  await loginAs(page, "bob@ajaia.dev");
  const shared = page.locator("section", { hasText: "Shared with me" });
  await expect(shared.getByText("E2E Launch Plan")).toBeVisible();
  await expect(shared.locator("li", { hasText: "E2E Launch Plan" }).getByText("View only")).toBeVisible();
  await page.screenshot({ path: "screenshots/05-dashboard-bob-shared.png" });

  await shared.getByText("E2E Launch Plan").click();
  await expect(page.getByText(/View only: you can read this document/)).toBeVisible();
  await expect(page.getByLabel("Document body")).toHaveAttribute("contenteditable", "false");
  await expect(page.getByLabel("Document title")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Share" })).toHaveCount(0);
  await page.screenshot({ path: "screenshots/06-viewer-readonly.png" });
});

test("import a .docx file as a new document", async ({ page }) => {
  await loginAs(page, "carol@ajaia.dev");
  await page.locator('input[type="file"]').setInputFiles("tests/fixtures/sample.docx");
  await expect(page).toHaveURL(/\/doc\//);
  await expect(page.getByLabel("Document title")).toHaveValue("sample");
  const body = page.getByLabel("Document body");
  await expect(body.locator("h1")).toHaveText("Quarterly Plan");
  await expect(body.locator("strong")).toHaveText("editor");
  await page.screenshot({ path: "screenshots/07-imported-docx.png" });
});
