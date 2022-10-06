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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.handler = exports.getEmailFromPath = void 0;
var fs_1 = require("fs");
var handlebars_1 = require("handlebars");
var mailer_1 = require("./mailer");
var getEmailFromPath = function (path) {
    var fileContents = undefined;
    fs_1["default"].readdirSync(path).forEach(function (file) {
        if (fileContents !== undefined) {
            // break after getting first file
            return;
        }
        var fileType = file.split(".").pop();
        var filename = file.replace(/^.*[\\\/]/, "").split(".")[0];
        if (filename === "index") {
            if (fileType === "html") {
                fileContents = fs_1["default"].readFileSync("".concat(path, "/").concat(file), "utf8");
            }
        }
    });
    return fileContents;
};
exports.getEmailFromPath = getEmailFromPath;
var handler = function (event, context) { return __awaiter(void 0, void 0, void 0, function () {
    var emailTemplatesDirectory, emailPath, requestBody, fullEmailPath, fileContents, template, renderedTemplate, providerApiKey, providerName, response;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                console.log("Email handler received email request from path ".concat(event.rawUrl));
                emailTemplatesDirectory = (_a = process.env.NETLIFY_EMAILS_DIRECTORY_OVERRIDE) !== null && _a !== void 0 ? _a : "./emails";
                if (event.httpMethod !== "POST") {
                    return [2 /*return*/, {
                            statusCode: 400,
                            body: JSON.stringify({
                                message: "Method not allowed"
                            }),
                            headers: {
                                Allow: "POST"
                            }
                        }];
                }
                if (!event.body) {
                    return [2 /*return*/, {
                            statusCode: 400,
                            body: JSON.stringify({
                                message: "Body required"
                            })
                        }];
                }
                emailPath = (_b = event.rawUrl.match(/emails\/([A-z-]*)[\?]?/)) === null || _b === void 0 ? void 0 : _b[1];
                if (!emailPath) {
                    return [2 /*return*/, {
                            statusCode: 400,
                            body: JSON.stringify({
                                message: "No email path provided - email path received: ".concat(event.rawUrl)
                            })
                        }];
                }
                // TODO - if we depend on email provider API keys, do we even need this secret?
                if (process.env.NETLIFY_EMAILS_SECRET === undefined ||
                    event.headers["netlify-emails-secret"] !== process.env.NETLIFY_EMAILS_SECRET) {
                    return [2 /*return*/, {
                            statusCode: 500,
                            body: JSON.stringify({
                                message: "Failed to process request"
                            })
                        }];
                }
                requestBody = JSON.parse(event.body);
                if (!requestBody.from) {
                    return [2 /*return*/, {
                            statusCode: 400,
                            body: JSON.stringify({
                                message: "From address is required"
                            })
                        }];
                }
                if (!requestBody.to) {
                    return [2 /*return*/, {
                            statusCode: 400,
                            body: JSON.stringify({
                                message: "To address is required"
                            })
                        }];
                }
                fullEmailPath = "".concat(emailTemplatesDirectory, "/").concat(emailPath);
                fileContents = (0, exports.getEmailFromPath)(fullEmailPath);
                template = handlebars_1["default"].compile(fileContents);
                renderedTemplate = template(requestBody.parameters);
                providerApiKey = process.env.NETLIFY_EMAILS_PROVIDER_API_KEY;
                if (providerApiKey === undefined) {
                    return [2 /*return*/, {
                            statusCode: 400,
                            body: JSON.stringify({
                                message: "An API key must be set for your email provider"
                            })
                        }];
                }
                providerName = process.env.NETLIFY_EMAILS_PROVIDER;
                if (providerName === undefined) {
                    return [2 /*return*/, {
                            statusCode: 400,
                            body: JSON.stringify({
                                message: "An email API provider name must be set"
                            })
                        }];
                }
                return [4 /*yield*/, (0, mailer_1["default"])({
                        configuration: {
                            providerName: providerName,
                            apiKey: providerApiKey,
                            mailgunDomain: process.env.NETLIFY_EMAILS_MAILGUN_DOMAIN
                        },
                        request: {
                            from: requestBody.from,
                            to: requestBody.to,
                            subject: (_c = requestBody.subject) !== null && _c !== void 0 ? _c : "",
                            html: renderedTemplate
                        }
                    })];
            case 1:
                response = _d.sent();
                return [2 /*return*/, response];
        }
    });
}); };
exports.handler = handler;
