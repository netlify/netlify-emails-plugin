import { Context } from "@netlify/functions/dist/function/context";
import { Event } from "@netlify/functions/dist/function/event";
import { Response } from "@netlify/functions/dist/function/response";
import { rest } from "msw";
import { cwd } from "process";
import { handler, IMailRequest } from ".";
import { server } from "../mocks/server";

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
  attachments: ["base64-encoded-file", "base64-encoded-file"],
  parameters: {
    name: "Alexander Hamilton",
  },
});

let sendEmailRequest: undefined | IMailRequest;
let sendEmailHeaders: undefined | Record<string, string>;

describe("Email handler", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    sendEmailRequest = undefined;
    sendEmailHeaders = undefined;
    server.use(
      rest.post(
        "https://test-netlify-integration-emails.netlify.app/.netlify/functions/send",
        async (req, res, ctx) => {
          sendEmailRequest = await req.json();
          sendEmailHeaders = req.headers.all();
          return await res(ctx.text("Email sent successfully"));
        }
      )
    );
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should send email and return 200", async () => {
    const secret = "super-secret";
    process.env.NETLIFY_EMAILS_SECRET = secret;
    process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
    process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
    process.env.NETLIFY_EMAILS_PROVIDER = "mailgun";
    process.env.NETLIFY_EMAILS_MAILGUN_DOMAIN = "test.com";
    process.env.NETLIFY_EMAILS_MAILGUN_HOST_REGION = "us";
    process.env.SITE_ID = "some-site-id";
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
      body: expect.stringContaining("Email sent successfully"),
    });
    expect(sendEmailHeaders).toEqual(
      expect.objectContaining({
        "site-id": "some-site-id",
      })
    );
    expect(sendEmailRequest?.request).toEqual({
      from: "somebody@test.com",
      to: "someone@test.com",
      cc: "cc@test.com",
      bcc: "bcc@test.com",
      subject: "Test Subject",
      attachments: ["base64-encoded-file", "base64-encoded-file"],
      html: expect.stringContaining("Alexander Hamilton"),
    });
    expect(sendEmailRequest?.configuration).toEqual({
      apiKey: "some-key",
      providerName: "mailgun",
      mailgunDomain: "test.com",
      mailgunHostRegion: "us",
    });
  });

  it("should send email request and handle error", async () => {
    server.use(
      rest.post(
        "https://test-netlify-integration-emails.netlify.app/.netlify/functions/send",
        async (req, res, ctx) => {
          return await res(ctx.status(400), ctx.text("Error sending email"));
        }
      )
    );

    const secret = "super-secret";
    process.env.NETLIFY_EMAILS_SECRET = secret;
    process.env.NETLIFY_EMAILS_DIRECTORY = "./fixtures/emails";
    process.env.NETLIFY_EMAILS_PROVIDER_API_KEY = "some-key";
    process.env.NETLIFY_EMAILS_PROVIDER = "mailgun";
    process.env.NETLIFY_EMAILS_MAILGUN_DOMAIN = "test.com";
    process.env.NETLIFY_EMAILS_MAILGUN_HOST_REGION = "us";
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
      body: expect.stringContaining("Error sending email"),
    });
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
});
