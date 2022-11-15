import mailer, { IEmailRequest } from ".";

let mockPostmarkSendEmail: (() => { ErrorCode: number }) | undefined;
let mockMailgunCreate: (() => { status: number; message: string }) | undefined;
let mockSendgridSend: () => void = jest.fn();

jest.mock("postmark", () => ({
  ServerClient: jest
    .fn()
    .mockImplementation(() => ({ sendEmail: mockPostmarkSendEmail })),
}));

jest.mock("mailgun.js", () =>
  jest.fn().mockImplementation(() => ({
    client: () => ({ messages: { create: mockMailgunCreate } }),
  }))
);

jest.mock("@sendgrid/mail", () => ({
  __esModule: true,
  default: {
    send: () => mockSendgridSend(),
    setApiKey: jest.fn(),
  },
}));

const testEmailRequest: IEmailRequest = {
  from: "test@test.com",
  to: "test@test.com",
  html: "Test",
  subject: "Test",
};

describe("Mailer function", () => {
  describe("using sendgrid", () => {
    beforeEach(() => {
      mockSendgridSend = () => {};
    });
    it("should return 200 with message if mailgun succeeds in sending email", async () => {
      const result = await mailer({
        configuration: {
          apiKey: "someKey",
          providerName: "sendgrid",
        },
        request: testEmailRequest,
      });

      expect(result).toEqual({
        body: expect.stringContaining("Email sent successfully using sendgrid"),
        statusCode: 200,
      });
    });

    it("should return 500 with message if sendgrid throws error", async () => {
      mockSendgridSend = () => {
        const error = { code: 403, message: "some error message" };
        throw error as unknown as Error;
      };
      const result = await mailer({
        configuration: {
          apiKey: "someKey",
          providerName: "sendgrid",
        },
        request: testEmailRequest,
      });

      expect(result).toEqual({
        body: expect.stringContaining(
          "The email API provider sendgrid failed to process the request: 403 - some error message"
        ),
        statusCode: 500,
      });
    });
  });
  describe("using mail gun", () => {
    beforeEach(() => {
      mockMailgunCreate = () => ({ status: 200, message: "done" });
    });

    it("should return 200 with message if mailgun succeeds in sending email", async () => {
      const result = await mailer({
        configuration: {
          apiKey: "someKey",
          providerName: "mailgun",
          mailgunDomain: "test.com",
        },
        request: testEmailRequest,
      });

      expect(result).toEqual({
        body: expect.stringContaining("Email sent successfully using mailgun"),
        statusCode: 200,
      });
    });

    it("should return 400 with message if domain not passed", async () => {
      const result = await mailer({
        configuration: {
          apiKey: "someKey",
          providerName: "mailgun",
        },
        request: testEmailRequest,
      });

      expect(result).toEqual({
        body: expect.stringContaining(
          "Domain should be specified when using Mailgun email API"
        ),
        statusCode: 400,
      });
    });

    it("should return 500 with message if mailgun throws error", async () => {
      mockMailgunCreate = () => {
        const error = { status: 403, message: "some error message" };
        throw error as unknown as Error;
      };
      const result = await mailer({
        configuration: {
          apiKey: "someKey",
          providerName: "mailgun",
          mailgunDomain: "test.com",
        },
        request: testEmailRequest,
      });

      expect(result).toEqual({
        body: expect.stringContaining(
          "The email API provider mailgun failed to process the request: 403 - some error message"
        ),
        statusCode: 500,
      });
    });

    it("should return 500 with message if mailgun returns error status", async () => {
      mockMailgunCreate = () => ({
        status: 403,
        message: "some error message",
      });
      const result = await mailer({
        configuration: {
          apiKey: "someKey",
          providerName: "mailgun",
          mailgunDomain: "test.com",
        },
        request: testEmailRequest,
      });

      expect(result).toEqual({
        body: expect.stringContaining(
          "The email API provider mailgun failed to process the request: 403 - some error message"
        ),
        statusCode: 500,
      });
    });
  });
  describe("using postmark", () => {
    beforeEach(() => {
      mockPostmarkSendEmail = () => ({ ErrorCode: 0 });
    });
    it("should return 200 with message if postmark succeeds in sending email", async () => {
      const result = await mailer({
        configuration: { apiKey: "someKey", providerName: "postmark" },
        request: testEmailRequest,
      });

      expect(result).toEqual({
        body: expect.stringContaining("Email sent successfully using postmark"),
        statusCode: 200,
      });
    });

    it("should return 500 with message if postmark throws error", async () => {
      mockPostmarkSendEmail = () => {
        const error = { statusCode: "123", code: "403" };
        throw error as unknown as Error;
      };
      const result = await mailer({
        configuration: { apiKey: "someKey", providerName: "postmark" },
        request: testEmailRequest,
      });

      expect(result).toEqual({
        body: expect.stringContaining(
          "The email API provider postmark failed to process the request: 403 - Failed with status code: 123"
        ),
        statusCode: 500,
      });
    });

    it("should return 500 with message if postmark returns error code", async () => {
      mockPostmarkSendEmail = () => ({ ErrorCode: 1, Message: "Some error" });
      const result = await mailer({
        configuration: { apiKey: "someKey", providerName: "postmark" },
        request: testEmailRequest,
      });

      expect(result).toEqual({
        body: expect.stringContaining(
          "The email API provider postmark failed to process the request: Some error"
        ),
        statusCode: 500,
      });
    });
  });
});
