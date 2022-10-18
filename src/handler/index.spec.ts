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

describe("Email handler", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
    process.env = { ...OLD_ENV }; // Make a copy
    mockSendgridSend.mockClear();
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  it("should reject request when no path provided", async () => {
    const secret = "super-secret";
    process.env.NETLIFY_EMAILS_SECRET = secret;
    process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
    process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
    process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";

    const response = await handler(
      {
        body: JSON.stringify({
          to: "someone@test.com",
          from: "somebody@test.com",
          subject: "Test Subject",
          parameters: {
            name: "Alexander Hamilton",
          },
        }),
        headers: { "netlify-emails-secret": secret },
        rawUrl: "http://localhost:8888/.netlify/functions/emails",
        httpMethod: "POST",
      } as unknown as Event,
      {} as unknown as Context
    );

    expect(response).toEqual({
      statusCode: 400,
      body: expect.stringContaining("No email path provided"),
    });
  });

  it("should reject request when no provider API key provided", async () => {
    const secret = "super-secret";
    process.env.NETLIFY_EMAILS_SECRET = secret;
    process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
    process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";

    const response = await handler(
      {
        body: JSON.stringify({
          to: "someone@test.com",
          from: "somebody@test.com",
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
        body: JSON.stringify({
          to: "someone@test.com",
          from: "somebody@test.com",
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
      body: expect.stringContaining("An email API provider name must be set"),
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

  it("should reject request when no from address provided", async () => {
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

  it("should render preview directory with available templates", async () => {
    const secret = "super-secret";
    process.env.NETLIFY_EMAILS_SECRET = secret;
    process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
    process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
    process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";
    process.env.CONTEXT = "dev";

    const response = (await handler(
      {
        headers: { "netlify-emails-secret": secret },
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
    const secret = "super-secret";
    process.env.NETLIFY_EMAILS_SECRET = secret;
    process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
    process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
    process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";
    process.env.CONTEXT = "dev";

    const response = (await handler(
      {
        headers: { "netlify-emails-secret": secret },
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

  describe("when using SendGrid", () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.resetModules(); // Most important - it clears the cache
      process.env = { ...OLD_ENV }; // Make a copy
      mockSendgridSend.mockClear();
    });

    afterAll(() => {
      process.env = OLD_ENV; // Restore old environment
    });

    it("should send email and return 200", async () => {
      const secret = "super-secret";
      process.env.NETLIFY_EMAILS_SECRET = secret;
      process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
      process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
      process.env.NETLIFY_EMAILS_PROVIDER = "sendgrid";
      const response = await handler(
        {
          body: JSON.stringify({
            to: "someone@test.com",
            from: "somebody@test.com",
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
        statusCode: 200,
        body: expect.stringContaining("Email successfully sent with sendgrid"),
      });
      expect(mockSendgridSend).toHaveBeenCalledWith({
        from: "somebody@test.com",
        to: "someone@test.com",
        subject: "Test Subject",
        html: expect.stringContaining("Alexander Hamilton"),
      });
    });
  });

  describe("when using MailGun", () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.resetModules(); // Most important - it clears the cache
      process.env = { ...OLD_ENV }; // Make a copy
      mockMailgunCreate.mockClear();
    });

    afterAll(() => {
      process.env = OLD_ENV; // Restore old environment
    });

    it("should send email and return 200", async () => {
      const secret = "super-secret";
      process.env.NETLIFY_EMAILS_SECRET = secret;
      process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
      process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
      process.env.NETLIFY_EMAILS_PROVIDER = "mailgun";
      process.env.NETLIFY_EMAILS_MAILGUN_DOMAIN = "domain.com";
      const response = await handler(
        {
          body: JSON.stringify({
            to: "someone@test.com",
            from: "somebody@test.com",
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
        statusCode: 200,
        body: expect.stringContaining("Email successfully sent with mailgun"),
      });
      expect(mockMailgunCreate).toHaveBeenCalledWith("domain.com", {
        from: "somebody@test.com",
        to: "someone@test.com",
        subject: "Test Subject",
        html: expect.stringContaining("Alexander Hamilton"),
      });
    });
  });

  describe("when using Postmark", () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.resetModules(); // Most important - it clears the cache
      process.env = { ...OLD_ENV }; // Make a copy
      mockPostmarkSendEmail.mockClear();
    });

    afterAll(() => {
      process.env = OLD_ENV; // Restore old environment
    });

    it("should send email and return 200", async () => {
      const secret = "super-secret";
      process.env.NETLIFY_EMAILS_SECRET = secret;
      process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
      process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
      process.env.NETLIFY_EMAILS_PROVIDER = "postmark";
      const response = await handler(
        {
          body: JSON.stringify({
            to: "someone@test.com",
            from: "somebody@test.com",
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
        statusCode: 200,
        body: expect.stringContaining("Email successfully sent with postmark"),
      });
      expect(mockPostmarkSendEmail).toHaveBeenCalledWith({
        From: "somebody@test.com",
        To: "someone@test.com",
        Subject: "Test Subject",
        HtmlBody: expect.stringContaining("Alexander Hamilton"),
      });
    });
  });
});
