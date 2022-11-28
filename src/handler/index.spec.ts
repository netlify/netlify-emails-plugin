import { Context } from "@netlify/functions/dist/function/context";
import { Event } from "@netlify/functions/dist/function/event";
import { Response } from "@netlify/functions/dist/function/response";
import { cwd } from "process";
import { handler } from ".";

const mockSendgridSend = jest.fn();
const mockMailgunCreate = jest.fn(() => ({ status: 200, message: "done" }));
const mockPostmarkSendEmail = jest.fn(() => ({ ErrorCode: 0 }));

jest.mock("@sendgrid/mail", () => ({
  __esModule: true,
  default: {
    send: (args: any) => mockSendgridSend(args),
    setApiKey: jest.fn(),
  },
}));

jest.mock("mailgun.js", () =>
  jest.fn().mockImplementation(() => ({
    client: () => ({ messages: { create: mockMailgunCreate } }),
  }))
);

jest.mock("postmark", () => ({
  ServerClient: jest
    .fn()
    .mockImplementation(() => ({ sendEmail: mockPostmarkSendEmail })),
}));

jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  readFileSync: (arg1: string, arg2: string) => {
    if (arg1.includes("preview.html")) {
      return jest
        .requireActual("fs")
        .readFileSync("./src/handler/preview/preview.html", arg2);
    }
    if (arg1.includes("directory.html")) {
      console.log(cwd());
      return jest
        .requireActual("fs")
        .readFileSync("./src/handler/preview/directory.html", arg2);
    }

    return jest.requireActual("fs").readFileSync(arg1, arg2);
  },
}));

const validEmailRequestBody = JSON.stringify({
  to: "someone@test.com",
  from: "somebody@test.com",
  subject: "Test Subject",
  cc: "cc@test.com",
  bcc: "bcc@test.com",
  parameters: {
    name: "Alexander Hamilton",
  },
});

describe("Email handler", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
    mockSendgridSend.mockClear();
    mockPostmarkSendEmail.mockClear();
    mockMailgunCreate.mockClear();
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it("should reject request when no provider API key provided", async () => {
    const secret = "super-secret";
    process.env.NETLIFY_EMAILS_SECRET = secret;
    process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
    process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";

    const response = await handler(
      {
        body: validEmailRequestBody,
        headers: { "netlify-emails-secret": secret },
        rawUrl: "http://localhost:8888/.netlify/functions/emails/confirm",
        httpMethod: "POST",
      } as unknown as Event,
      {} as unknown as Context
    );

    expect(response).toEqual({
      statusCode: 400,
      body: expect.stringContaining(
        "An API key must be set for your email provider"
      ),
    });
  });

  it("should reject request when no provider name provided", async () => {
    const secret = "super-secret";
    process.env.NETLIFY_EMAILS_SECRET = secret;
    process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
    process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";

    const response = await handler(
      {
        body: validEmailRequestBody,
        headers: { "netlify-emails-secret": secret },
        rawUrl: "http://localhost:8888/.netlify/functions/emails/confirm",
        httpMethod: "POST",
      } as unknown as Event,
      {} as unknown as Context
    );

    expect(response).toEqual({
      statusCode: 400,
      body: expect.stringContaining("An email API provider name must be set"),
    });
  });

  it("should return 404 when no email file found", async () => {
    const secret = "super-secret";
    process.env.NETLIFY_EMAILS_SECRET = secret;
    process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
    process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
    process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";

    const response = await handler(
      {
        body: validEmailRequestBody,
        headers: { "netlify-emails-secret": secret },
        rawUrl: "http://localhost:8888/.netlify/functions/emails/error",
        httpMethod: "POST",
      } as unknown as Event,
      {} as unknown as Context
    );

    expect(response).toEqual({
      statusCode: 404,
      body: expect.stringContaining(
        "No email file found in directory: ./fixtures/emails/error"
      ),
    });
  });

  it("should return 404 when email route not found", async () => {
    const secret = "super-secret";
    process.env.NETLIFY_EMAILS_SECRET = secret;
    process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
    process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
    process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";

    const response = await handler(
      {
        body: validEmailRequestBody,
        headers: { "netlify-emails-secret": secret },
        rawUrl:
          "http://localhost:8888/.netlify/functions/emails/does-not-exist",
        httpMethod: "POST",
      } as unknown as Event,
      {} as unknown as Context
    );

    expect(response).toEqual({
      statusCode: 404,
      body: expect.stringContaining(
        "Email path ./fixtures/emails/does-not-exist does not exist"
      ),
    });
  });

  it("should reject request when no body provided", async () => {
    const secret = "super-secret";
    process.env.NETLIFY_EMAILS_SECRET = secret;
    process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
    process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
    process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";

    const response = await handler(
      {
        body: null,
        headers: { "netlify-emails-secret": secret },
        rawUrl: "http://localhost:8888/.netlify/functions/emails/confirm",
        httpMethod: "POST",
      } as unknown as Event,
      {} as unknown as Context
    );

    expect(response).toEqual({
      statusCode: 400,
      body: expect.stringContaining("Body required"),
    });
  });

  it("should default to ./emails when no directory set", async () => {
    const secret = "super-secret";
    process.env.NETLIFY_EMAILS_SECRET = secret;
    process.env.NETLIFY_EMAILS_DIRECTORY = undefined;
    process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
    process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";

    const response = await handler(
      {
        body: validEmailRequestBody,
        headers: { "netlify-emails-secret": secret },
        rawUrl: "http://localhost:8888/.netlify/functions/emails/confirm",
        httpMethod: "POST",
      } as unknown as Event,
      {} as unknown as Context
    );

    expect(response).toEqual({
      statusCode: 404,
      body: expect.stringContaining("./emails/confirm does not exist"),
    });
  });

  it("should reject request when no from address provided", async () => {
    const secret = "super-secret";
    process.env.NETLIFY_EMAILS_SECRET = secret;
    process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
    process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
    process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";

    const response = await handler(
      {
        body: JSON.stringify({
          to: "someone@test.com",
          subject: "Test Subject",
          parameters: {
            name: "Alexander Hamilton",
          },
        }),
        headers: { "netlify-emails-secret": secret },
        rawUrl: "http://localhost:8888/.netlify/functions/emails/confirm",
        httpMethod: "POST",
      } as unknown as Event,
      {} as unknown as Context
    );

    expect(response).toEqual({
      statusCode: 400,
      body: expect.stringContaining("From address is required"),
    });
  });

  it("should reject request when no to address provided", async () => {
    const secret = "super-secret";
    process.env.NETLIFY_EMAILS_SECRET = secret;
    process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
    process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
    process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";

    const response = await handler(
      {
        body: JSON.stringify({
          from: "someone@test.com",
          subject: "Test Subject",
          parameters: {
            name: "Alexander Hamilton",
          },
        }),
        headers: { "netlify-emails-secret": secret },
        rawUrl: "http://localhost:8888/.netlify/functions/emails/confirm",
        httpMethod: "POST",
      } as unknown as Event,
      {} as unknown as Context
    );

    expect(response).toEqual({
      statusCode: 400,
      body: expect.stringContaining("To address is required"),
    });
  });

  describe("when calling the preview tool", () => {
    it("should render preview directory with available templates", async () => {
      process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
      process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
      process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";
      process.env.CONTEXT = "dev";

      const response = (await handler(
        {
          rawUrl: "http://localhost:8888/.netlify/functions/emails/_preview",
          httpMethod: "GET",
        } as unknown as Event,
        {} as unknown as Context
      )) as Response;

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain("Available templates");
      expect(response.body).toContain("confirm");
    });

    it("should render preview for email with available templates and parameters", async () => {
      process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
      process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
      process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";
      process.env.CONTEXT = "dev";

      const response = (await handler(
        {
          rawUrl:
            "http://localhost:8888/.netlify/functions/emails/_preview/confirm",
          httpMethod: "GET",
        } as unknown as Event,
        {} as unknown as Context
      )) as Response;

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain("This is the confirm email");
      expect(response.body).toContain("Parameters");
      expect(response.body).toContain('<input id="name"');
    });

    it("should reject template preview when email directory does not exist", async () => {
      process.env.NETLIFY_EMAILS_DIRECTORY = "./some/phantom/directory";
      process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
      process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";
      process.env.CONTEXT = "dev";

      const response = await handler(
        {
          rawUrl:
            "http://localhost:8888/.netlify/functions/emails/_preview/confirm",
          httpMethod: "GET",
        } as unknown as Event,
        {} as unknown as Context
      );

      expect(response).toEqual({
        statusCode: 400,
        body: expect.stringContaining(
          "Unable to read emails from email directory './some/phantom/directory'."
        ),
      });
    });

    it("should reject directory preview when email directory does not exist", async () => {
      process.env.NETLIFY_EMAILS_DIRECTORY = "./some/phantom/directory";
      process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
      process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";
      process.env.CONTEXT = "dev";

      const response = await handler(
        {
          rawUrl: "http://localhost:8888/.netlify/functions/emails/_preview",
          httpMethod: "GET",
        } as unknown as Event,
        {} as unknown as Context
      );

      expect(response).toEqual({
        statusCode: 400,
        body: expect.stringContaining(
          "Unable to read emails from email directory './some/phantom/directory'."
        ),
      });
    });

    it("should reject template preview when template does not exist", async () => {
      process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
      process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
      process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";
      process.env.CONTEXT = "dev";

      const response = await handler(
        {
          rawUrl:
            "http://localhost:8888/.netlify/functions/emails/_preview/not-here",
          httpMethod: "GET",
        } as unknown as Event,
        {} as unknown as Context
      );

      expect(response).toEqual({
        statusCode: 400,
        body: expect.stringContaining(
          "Template not found for './fixtures/emails/not-here'. A file called 'index.html' must exist within this folder."
        ),
      });
    });
  });

  describe("when using SendGrid", () => {
    it("should send email and return 200", async () => {
      const secret = "super-secret";
      process.env.NETLIFY_EMAILS_SECRET = secret;
      process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
      process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
      process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";
      const response = await handler(
        {
          body: validEmailRequestBody,
          headers: { "netlify-emails-secret": secret },
          rawUrl: "http://localhost:8888/.netlify/functions/emails/confirm",
          httpMethod: "POST",
        } as unknown as Event,
        {} as unknown as Context
      );

      expect(response).toEqual({
        statusCode: 200,
        body: expect.stringContaining("Email sent successfully using sendgrid"),
      });
      expect(mockSendgridSend).toHaveBeenCalledWith({
        from: "somebody@test.com",
        to: "someone@test.com",
        cc: "cc@test.com",
        bcc: "bcc@test.com",
        subject: "Test Subject",
        html: expect.stringContaining("Alexander Hamilton"),
      });
    });
  });

  describe("when using Mailgun", () => {
    it("should send email and return 200", async () => {
      const secret = "super-secret";
      process.env.NETLIFY_EMAILS_SECRET = secret;
      process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
      process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
      process.env.NETLIFY_EMAILS_PROVIDER = "mailgun";
      process.env.NETLIFY_EMAILS_MAILGUN_DOMAIN = "domain.com";
      const response = await handler(
        {
          body: validEmailRequestBody,
          headers: { "netlify-emails-secret": secret },
          rawUrl: "http://localhost:8888/.netlify/functions/emails/confirm",
          httpMethod: "POST",
        } as unknown as Event,
        {} as unknown as Context
      );

      expect(response).toEqual({
        statusCode: 200,
        body: expect.stringContaining("Email sent successfully using mailgun"),
      });
      expect(mockMailgunCreate).toHaveBeenCalledWith("domain.com", {
        from: "somebody@test.com",
        to: "someone@test.com",
        cc: "cc@test.com",
        bcc: "bcc@test.com",
        subject: "Test Subject",
        html: expect.stringContaining("Alexander Hamilton"),
      });
    });
  });

  describe("when using Postmark", () => {
    it("should send email and return 200", async () => {
      const secret = "super-secret";
      process.env.NETLIFY_EMAILS_SECRET = secret;
      process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
      process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
      process.env.NETLIFY_EMAILS_PROVIDER = "postmark";
      const response = await handler(
        {
          body: validEmailRequestBody,
          headers: { "netlify-emails-secret": secret },
          rawUrl: "http://localhost:8888/.netlify/functions/emails/confirm",
          httpMethod: "POST",
        } as unknown as Event,
        {} as unknown as Context
      );

      expect(response).toEqual({
        statusCode: 200,
        body: expect.stringContaining("Email sent successfully using postmark"),
      });
      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "somebody@test.com",
        To: "someone@test.com",
        Cc: "cc@test.com",
        Bcc: "bcc@test.com",
        Subject: "Test Subject",
        HtmlBody: expect.stringContaining("Alexander Hamilton"),
      });
    });
  });
});
