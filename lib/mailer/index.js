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
    var _a;
    const acceptedProviders = ["mailgun", "postmark", "sendgrid"];
    const emailProvider = (_a = process.env.NETLIFY_EMAILS_PROVIDER) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (emailProvider === undefined) {
        return {
            status: 400,
            body: JSON.stringify("No email provider specified"),
        };
    }
    if (acceptedProviders.find((acceptedProvider) => acceptedProvider === emailProvider) === undefined) {
        return {
            status: 404,
            body: JSON.stringify(`No supported email provider located for: ${emailProvider}`),
        };
    }
    else {
        // TODO - Catch and manage errors from each handler and return the error message, with a 500 code
        if (emailProvider === "mailgun") {
            console.log("Sending email using Mailgun...");
            if (configuration.mailgunDomain === undefined) {
                return {
                    status: 400,
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
                console.log(result.status, "status");
            }
            catch (e) {
                console.log(JSON.stringify(e));
            }
        }
        if (emailProvider === "postmark") {
            console.log("Sending email using Postmark...");
            const client = new postmark_1.ServerClient(configuration.apiKey);
            client.sendEmail({
                From: request.from,
                To: request.to,
                Subject: request.subject,
                HtmlBody: request.html,
            });
        }
        if (emailProvider === "sendgrid") {
            console.log("Sending email using Sendgrid...");
            mail_1.default.setApiKey(configuration.apiKey);
            const result = yield mail_1.default.send({
                from: request.from,
                to: request.to,
                subject: request.subject,
                html: request.html,
            });
        }
        return {
            status: 200,
            body: JSON.stringify("Email sent"),
        };
    }
});
exports.default = mailer;
