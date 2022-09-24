"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPreBuild = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const onPreBuild = () => {
    const emailFunctionDirectory = (0, path_1.join)(".netlify", "functions-internal", "email");
    const emailTemplatesDirectory = "emails";
    const pluginNodeModuleDirectory = (0, path_1.join)("node_modules", "@netlify", "plugin-emails", "src");
    fs_1.default.mkdirSync(emailFunctionDirectory, {
        recursive: true,
    });
    fs_1.default.copyFileSync((0, path_1.join)(pluginNodeModuleDirectory, "handler", "index.ts"), (0, path_1.join)(emailFunctionDirectory, "email.ts"));
    const customPreDeliveryJsFileExists = fs_1.default.existsSync((0, path_1.join)(emailTemplatesDirectory, "preDelivery.js"));
    const customPreDeliveryTsFileExists = fs_1.default.existsSync((0, path_1.join)(emailTemplatesDirectory, "preDelivery.ts"));
    const deletePreviousPredeliveryFiles = () => {
        const internalPreDeliveryJsFileExists = fs_1.default.existsSync((0, path_1.join)(emailFunctionDirectory, "preDelivery.js"));
        const internalPreDeliveryTsFileExists = fs_1.default.existsSync((0, path_1.join)(emailFunctionDirectory, "preDelivery.ts"));
        if (internalPreDeliveryJsFileExists) {
            fs_1.default.unlinkSync((0, path_1.join)(emailFunctionDirectory, "preDelivery.js"));
        }
        if (internalPreDeliveryTsFileExists) {
            fs_1.default.unlinkSync((0, path_1.join)(emailFunctionDirectory, "preDelivery.ts"));
        }
    };
    if (customPreDeliveryJsFileExists || customPreDeliveryTsFileExists) {
        deletePreviousPredeliveryFiles();
        console.log("Custom pre-delivery file detected - handler will be called before emails delivered");
        const preDeliveryFile = (0, path_1.join)(emailTemplatesDirectory, customPreDeliveryJsFileExists ? "preDelivery.js" : "preDelivery.ts");
        fs_1.default.copyFileSync(preDeliveryFile, (0, path_1.join)(emailFunctionDirectory, `preDelivery${customPreDeliveryJsFileExists ? ".js" : ".ts"}`));
    }
    else {
        deletePreviousPredeliveryFiles();
        fs_1.default.copyFileSync((0, path_1.join)(pluginNodeModuleDirectory, "handler", "preDelivery.js"), (0, path_1.join)(emailFunctionDirectory, "preDelivery.js"));
    }
};
exports.onPreBuild = onPreBuild;
