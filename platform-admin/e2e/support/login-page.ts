import type { Locator, Page } from "@playwright/test";

// Page Object: keeps all login page selectors in one place.
export class LoginPage {
  readonly heading: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly forgotLink: Locator;
  readonly form: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Sign In" });
    this.email = page.getByLabel("Email", { exact: true });
    // exact: true is required because the "eye" button also has an aria-label
    // containing the word "Password".
    this.password = page.getByLabel("Password", { exact: true });
    this.submit = page.getByRole("button", { name: "Sign in" });
    this.forgotLink = page.getByRole("link", { name: "Forgot Password?" });
    // The error is also shown in a toast, so we search only inside the form.
    this.form = page.locator("form");
  }

  async goto(search = "") {
    await this.page.goto(`/auth/login${search}`);
  }

  async signIn(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
