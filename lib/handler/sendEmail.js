"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_js_1 = __importDefault(require("crypto-js"));
const sendEmail = ({ template, to, from, subject, parameters, }) => {
    var _a;
    if (process.env.NETLIFY_EMAILS_TOKEN ||
        process.env.NEXT_PUBLIC_NETLIFY_EMAILS_TOKEN === undefined) {
        throw new Error("Emails token must be set");
    }
    const emailRequestBody = Object.assign({ _to: to, _from: from, _subject: subject }, parameters);
    const ciphertext = crypto_js_1.default.AES.encrypt(JSON.stringify(emailRequestBody), (_a = process.env.NETLIFY_EMAILS_TOKEN) !== null && _a !== void 0 ? _a : process.env.NEXT_PUBLIC_NETLIFY_EMAILS_TOKEN).toString();
    fetch(`./.netlify/functions/email/${template}`, {
        method: "POST",
        body: ciphertext,
    });
};
exports.default = sendEmail;
