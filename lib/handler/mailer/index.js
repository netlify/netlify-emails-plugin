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
const postmark_1 = require("postmark");
const mail_1 = __importDefault(require("@sendgrid/mail"));
const mailgun_js_1 = __importDefault(require("mailgun.js"));
const form_data_1 = __importDefault(require("form-data"));
const mailer = ({ configuration, request, }) => __awaiter(void 0, void 0, void 0, function* () {
    const acceptedProviders = ["mailgun", "postmark", "sendgrid"];
    const emailProvider = configuration.providerName.toLowerCase();
    if (acceptedProviders.find((acceptedProvider) => acceptedProvider === emailProvider) === undefined) {
        return {
            statusCode: 404,
            body: JSON.stringify(`No supported email provider located for: ${emailProvider}`),
        };
    }
    else {
        let errorMessage = undefined;
        if (emailProvider === "mailgun") {
            console.log("Sending email using Mailgun...");
            if (configuration.mailgunDomain === undefined) {
                return {
                    statusCode: 400,
                    body: JSON.stringify("Domain should be specified when using Mailgun email API"),
                };
            }
            const mailgun = new mailgun_js_1.default(form_data_1.default);
            const mailgunClient = mailgun.client({
                username: "api",
                key: configuration.apiKey,
                url: "https://api.eu.mailgun.net",
            });
            try {
                const result = yield mailgunClient.messages.create(configuration.mailgunDomain, {
                    from: request.from,
                    to: request.to,
                    subject: request.subject,
                    html: request.html,
                });
                if (result.status !== 200) {
                    errorMessage = `${result.status} - ${result.message}`;
                }
            }
            catch (e) {
                const error = e;
                errorMessage = `${error.status} - ${error.message}`;
            }
        }
        if (emailProvider === "postmark") {
            console.log("Sending email using Postmark...");
            const client = new postmark_1.ServerClient(configuration.apiKey);
            try {
                const result = yield client.sendEmail({
                    From: request.from,
                    To: request.to,
                    Subject: request.subject,
                    HtmlBody: request.html,
                });
                if (result.ErrorCode !== 0) {
                    errorMessage = result.Message;
                }
            }
            catch (e) {
                const error = e;
                errorMessage = `${error.code} - Failed with status code: ${error.statusCode}`;
            }
        }
        if (emailProvider === "sendgrid") {
            console.log("Sending email using Sendgrid...");
            mail_1.default.setApiKey(configuration.apiKey);
            try {
                yield mail_1.default.send({
                    from: request.from,
                    to: request.to,
                    subject: request.subject,
                    html: request.html,
                });
            }
            catch (e) {
                const error = e;
                errorMessage = `${error.code} - ${error.message}`;
            }
        }
        if (errorMessage) {
            return {
                statusCode: 500,
                body: JSON.stringify(`The email API provider ${emailProvider} failed to process the request: ${errorMessage}`),
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify(`Email successfully sent with ${emailProvider}`),
        };
    }
});
exports.default = mailer;
