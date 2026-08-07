import { expect, test } from '@playwright/test';

async function signUp(page: import('@playwright/test').Page, email: string) {
  await page.goto('/sign-up');
  await page.getByLabel('Name').fill('Learning Tester');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill('learning-project-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/notes$/);
}

async function createNote(page: import('@playwright/test').Page, title: string, body: string) {
  await page.getByRole('link', { name: 'New note' }).click();
  await page.getByLabel('Note title').fill(title);
  await page.locator('[contenteditable="true"][aria-label="Note body"]').fill(body);
  await page.getByRole('button', { name: 'Create note' }).click();
  await expect(page).toHaveURL(/\/notes\/[0-9a-f-]+$/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Save note' })).toBeDisabled();
  await expect(page.getByLabel('Note title')).toHaveValue(title);
}

test('authentication and note CRUD', async ({ page }) => {
  await signUp(page, 'crud-e2e@example.com');
  await createNote(page, 'First title', 'A persisted body');

  await page.getByLabel('Note title').fill('Edited title');
  const saveResponse = page.waitForResponse(
    (response) => response.request().method() === 'PATCH' && response.url().includes('/api/notes/'),
  );
  const saveButton = page.getByRole('button', { name: 'Save note' });
  await saveButton.click();
  const response = await saveResponse;
  expect(response.status()).toBe(200);
  expect((await response.json()).note.title).toBe('Edited title');
  await expect(saveButton).toBeDisabled();

  await page.getByRole('link', { name: 'Back to notes' }).click();
  await page.getByRole('link', { name: /Edited title/ }).click();
  await expect(page.getByLabel('Note title')).toHaveValue('Edited title');
  await expect(page.locator('[contenteditable="true"][aria-label="Note body"]')).toContainText(
    'A persisted body',
  );

  await page.getByRole('button', { name: 'Delete note' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: /Edited title/ })).toBeVisible();
  await dialog.getByRole('button', { name: 'Delete note' }).click();
  await expect(page).toHaveURL(/\/notes$/);
  await expect(page.getByText('You do not have any notes yet.')).toBeVisible();
});

test('public link can be viewed anonymously and revoked', async ({ browser, page }) => {
  await signUp(page, 'sharing-e2e@example.com');
  await createNote(page, 'Shared learning', 'Visible to an anonymous reader');

  await page.getByRole('button', { name: 'Enable public link' }).click();
  const shareUrl = await page.getByLabel('Public share URL').inputValue();

  const anonymousContext = await browser.newContext();
  const anonymousPage = await anonymousContext.newPage();
  await anonymousPage.goto(shareUrl);
  await expect(anonymousPage.getByRole('heading', { name: 'Shared learning' })).toBeVisible();
  await expect(anonymousPage.getByText('Visible to an anonymous reader')).toBeVisible();

  await page.getByRole('button', { name: 'Disable public link' }).click();
  await expect(page.getByRole('button', { name: 'Enable public link' })).toBeVisible();
  await anonymousPage.reload();
  await expect(anonymousPage.getByRole('heading', { name: 'Note not found' })).toBeVisible();
  await anonymousContext.close();
});
