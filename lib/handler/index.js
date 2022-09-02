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
    console.log(`Getting the template for: ${path}`);
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
                console.log("Printing .html contents", fileContents);
            }
        }
    });
    return fileContents;
};
exports.getEmailFromPath = getEmailFromPath;
const handler = (event, _) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const emailPath = (_a = event.rawUrl.match(/email\/([A-z-]*)[\?]?/)) === null || _a === void 0 ? void 0 : _a[1];
    const params = event.queryStringParameters;
    if (!emailPath) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "No email path provided",
            }),
        };
    }
    if (!(params === null || params === void 0 ? void 0 : params._from)) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "From address is required",
            }),
        };
    }
    if (!(params === null || params === void 0 ? void 0 : params._to)) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "Too address is required",
            }),
        };
    }
    const fullEmailPath = `./emails/${emailPath}`;
    const fileContents = (0, exports.getEmailFromPath)(fullEmailPath);
    const template = handlebars_1.default.compile(fileContents);
    const renderedTemplate = template(params);
    const serverToken = process.env.EMAIL_API_TOKEN;
    const client = new postmark_1.ServerClient(serverToken);
    client.sendEmail({
        From: params === null || params === void 0 ? void 0 : params._from,
        To: params === null || params === void 0 ? void 0 : params._to,
        Subject: (_b = params === null || params === void 0 ? void 0 : params._subject) !== null && _b !== void 0 ? _b : "",
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
