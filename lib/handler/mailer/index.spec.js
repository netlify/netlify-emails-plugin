"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = __importDefault(require("."));
let mockPostmarkSendEmail = undefined;
let mockMailgunCreate = undefined;
let mockSendgridSend = jest.fn();
jest.mock("postmark", () => ({
    ServerClient: jest
        .fn()
        .mockImplementation(() => ({ sendEmail: mockPostmarkSendEmail })),
}));
jest.mock("mailgun.js", () => jest.fn().mockImplementation(() => ({
    client: () => ({ messages: { create: mockMailgunCreate } }),
})));
jest.mock("@sendgrid/mail", () => ({
    __esModule: true,
    default: {
        send: () => mockSendgridSend(),
        setApiKey: jest.fn(),
    },
}));
const testEmailRequest = {
    from: "test@test.com",
    to: "test@test.com",
    html: "Test",
    subject: "Test",
};
describe("Mailer function", () => {
    describe("using sendgrid", () => {
        beforeEach(() => {
            mockSendgridSend = () => { };
        });
        it("should return 200 with message if mailgun succeeds in sending email", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, _1.default)({
                configuration: {
                    apiKey: "someKey",
                    providerName: "sendgrid",
                },
                request: testEmailRequest,
            });
            expect(result).toEqual({
                body: '"Email successfully sent with sendgrid"',
                statusCode: 200,
            });
        }));
        it("should return 500 with message if sendgrid throws error", () => __awaiter(void 0, void 0, void 0, function* () {
            mockSendgridSend = () => {
                throw { code: 403, message: "some error message" };
            };
            const result = yield (0, _1.default)({
                configuration: {
                    apiKey: "someKey",
                    providerName: "sendgrid",
                },
                request: testEmailRequest,
            });
            expect(result).toEqual({
                body: '"The email API provider sendgrid failed to process the request: 403 - some error message"',
                statusCode: 500,
            });
        }));
    });
    describe("using mail gun", () => {
        beforeEach(() => {
            mockMailgunCreate = () => ({ status: 200, message: "done" });
        });
        it("should return 200 with message if mailgun succeeds in sending email", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, _1.default)({
                configuration: {
                    apiKey: "someKey",
                    providerName: "mailgun",
                    mailgunDomain: "test.com",
                },
                request: testEmailRequest,
            });
            expect(result).toEqual({
                body: '"Email successfully sent with mailgun"',
                statusCode: 200,
            });
        }));
        it("should return 400 with message if domain not passed", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, _1.default)({
                configuration: {
                    apiKey: "someKey",
                    providerName: "mailgun",
                },
                request: testEmailRequest,
            });
            expect(result).toEqual({
                body: '"Domain should be specified when using Mailgun email API"',
                statusCode: 400,
            });
        }));
        it("should return 500 with message if mailgun throws error", () => __awaiter(void 0, void 0, void 0, function* () {
            mockMailgunCreate = () => {
                throw { status: 403, message: "some error message" };
            };
            const result = yield (0, _1.default)({
                configuration: {
                    apiKey: "someKey",
                    providerName: "mailgun",
                    mailgunDomain: "test.com",
                },
                request: testEmailRequest,
            });
            expect(result).toEqual({
                body: '"The email API provider mailgun failed to process the request: 403 - some error message"',
                statusCode: 500,
            });
        }));
        it("should return 500 with message if mailgun returns error status", () => __awaiter(void 0, void 0, void 0, function* () {
            mockMailgunCreate = () => ({
                status: 403,
                message: "some error message",
            });
            const result = yield (0, _1.default)({
                configuration: {
                    apiKey: "someKey",
                    providerName: "mailgun",
                    mailgunDomain: "test.com",
                },
                request: testEmailRequest,
            });
            expect(result).toEqual({
                body: '"The email API provider mailgun failed to process the request: 403 - some error message"',
                statusCode: 500,
            });
        }));
    });
    describe("using postmark", () => {
        beforeEach(() => {
            mockPostmarkSendEmail = () => ({ ErrorCode: 0 });
        });
        it("should return 200 with message if postmark succeeds in sending email", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield (0, _1.default)({
                configuration: { apiKey: "someKey", providerName: "postmark" },
                request: testEmailRequest,
            });
            expect(result).toEqual({
                body: '"Email successfully sent with postmark"',
                statusCode: 200,
            });
        }));
        it("should return 500 with message if postmark throws error", () => __awaiter(void 0, void 0, void 0, function* () {
            mockPostmarkSendEmail = () => {
                throw { statusCode: "123", code: "403" };
            };
            const result = yield (0, _1.default)({
                configuration: { apiKey: "someKey", providerName: "postmark" },
                request: testEmailRequest,
            });
            expect(result).toEqual({
                body: '"The email API provider postmark failed to process the request: 403 - Failed with status code: 123"',
                statusCode: 500,
            });
        }));
        it("should return 500 with message if postmark returns error code", () => __awaiter(void 0, void 0, void 0, function* () {
            mockPostmarkSendEmail = () => ({ ErrorCode: 1, Message: "Some error" });
            const result = yield (0, _1.default)({
                configuration: { apiKey: "someKey", providerName: "postmark" },
                request: testEmailRequest,
            });
            expect(result).toEqual({
                body: '"The email API provider postmark failed to process the request: Some error"',
                statusCode: 500,
            });
        }));
    });
});
