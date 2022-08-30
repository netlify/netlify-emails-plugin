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
const getEmailFromPath = (path) => {
    console.log(`Getting template for: ${path}`);
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
                console.log("Printing the .html contents", fileContents);
            }
        }
    });
    return fileContents;
};
exports.getEmailFromPath = getEmailFromPath;
const handler = (event, _) => __awaiter(void 0, void 0, void 0, function* () {
    const emailPath = event.rawUrl.split(".netlify/functions/email/")[1];
    const fullEmailPath = `./emails/${emailPath}`;
    const fileContents = (0, exports.getEmailFromPath)(fullEmailPath);
    // TODO - Next step is to use the fileContents (the template) and pass in parameters to template and replace handlebars
    return {
        statusCode: 200,
        body: JSON.stringify({ message: fileContents }),
    };
});
exports.handler = handler;
