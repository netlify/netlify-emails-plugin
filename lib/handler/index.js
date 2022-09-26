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
const crypto_js_1 = __importDefault(require("crypto-js"));
const preDelivery_1 = __importDefault(require("./preDelivery"));
const getEmailFromPath = (path) => {
    let fileContents = undefined;
    fs_1.default.readdirSync(path).forEach((file) => {
        if (fileContents !== undefined) {
            // break after getting first file
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
    var _a, _b;
    try {
        (0, preDelivery_1.default)(Object.freeze(event), Object.freeze(context));
    }
    catch (e) {
        return {
            statusCode: 400,
            body: `Pre-delivery validation failed: ${e.message}`,
            headers: {
                Allow: "POST",
            },
        };
    }
    console.log(event.httpMethod);
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
    const emailPath = (_a = event.rawUrl.match(/email\/([A-z-]*)[\?]?/)) === null || _a === void 0 ? void 0 : _a[1];
    if (!emailPath) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "No email path provided",
            }),
        };
    }
    if (process.env.NETLIFY_EMAILS_TOKEN === undefined) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: "Unable to decrypt body - No token set during build process",
            }),
        };
    }
    const bytes = crypto_js_1.default.AES.decrypt(event.body, process.env.NETLIFY_EMAILS_TOKEN);
    const requestBody = JSON.parse(bytes.toString(crypto_js_1.default.enc.Utf8));
    if (!requestBody._from) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "From address is required",
            }),
        };
    }
    if (!requestBody._to) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "To address is required",
            }),
        };
    }
    const fullEmailPath = `./emails/${emailPath}`;
    const fileContents = (0, exports.getEmailFromPath)(fullEmailPath);
    const template = handlebars_1.default.compile(fileContents);
    const renderedTemplate = template(requestBody);
    const serverToken = process.env.EMAIL_API_TOKEN;
    const client = new postmark_1.ServerClient(serverToken);
    client.sendEmail({
        From: requestBody._from,
        To: requestBody._to,
        Subject: (_b = requestBody._subject) !== null && _b !== void 0 ? _b : "",
        HtmlBody: renderedTemplate,
    });
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: `Email sent using template: ./emails/${emailPath}`,
        }),
    };
});
exports.handler = handler;
