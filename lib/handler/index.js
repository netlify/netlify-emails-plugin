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
exports.handler = exports.getEmailFromPath = void 0;
const fs_1 = __importDefault(require("fs"));
const handlebars_1 = __importDefault(require("handlebars"));
const postmark_1 = require("postmark");
const getEmailFromPath = (path) => {
    let fileContents = undefined;
    fs_1.default.readdirSync(path).forEach((file) => {
        if (fileContents !== undefined) {
            // Break after getting first file
            return;
        }
        const fileType = file.split(".").pop();
        var filename = file.replace(/^.*[\\\/]/, "").split(".")[0];
        if (filename === "index") {
            if (fileType === "html") {
                fileContents = fs_1.default.readFileSync(`${path}/${file}`, "utf8");
            }
        }
    });
    return fileContents;
};
exports.getEmailFromPath = getEmailFromPath;
const handler = (event, context) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const emailTemplatesDirectory = (_a = process.env.NETLIFY_EMAILS_DIRECTORY_OVERRIDE) !== null && _a !== void 0 ? _a : "./emails";
    console.log({ emailTemplatesDirectory }, process.env.NETLIFY_EMAILS_DIRECTORY_OVERRIDE);
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 400,
            body: "METHOD NOT ALLOWED",
            headers: {
                Allow: "POST",
            },
        };
    }
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "Body required",
            }),
        };
    }
    const emailPath = (_b = event.rawUrl.match(/email\/([A-z-]*)[\?]?/)) === null || _b === void 0 ? void 0 : _b[1];
    if (!emailPath) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "No email path provided",
            }),
        };
    }
    if (process.env.NETLIFY_EMAILS_TOKEN === undefined ||
        event.headers["netlify-email-token"] !== process.env.NETLIFY_EMAILS_TOKEN) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Failed to process request",
            }),
        };
    }
    const requestBody = JSON.parse(event.body);
    if (!requestBody.from) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "From address is required",
            }),
        };
    }
    if (!requestBody.to) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "To address is required",
            }),
        };
    }
    const fullEmailPath = `${emailTemplatesDirectory}/${emailPath}`;
    const fileContents = (0, exports.getEmailFromPath)(fullEmailPath);
    const template = handlebars_1.default.compile(fileContents);
    const renderedTemplate = template(requestBody.parameters);
    const serverToken = process.env.NETLIFY_EMAIL_API_TOKEN;
    const client = new postmark_1.ServerClient(serverToken);
    client.sendEmail({
        From: requestBody.from,
        To: requestBody.to,
        Subject: (_c = requestBody.subject) !== null && _c !== void 0 ? _c : "",
        HtmlBody: renderedTemplate,
    });
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: `Email sent using template: ${emailTemplatesDirectory}/${emailPath}`,
        }),
    };
});
exports.handler = handler;
