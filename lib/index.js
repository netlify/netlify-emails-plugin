"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onPreBuild = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const onPreBuild = () => {
    const emailFunctionDirectory = (0, path_1.join)(".netlify", "functions-internal", "emails");
    const pluginNodeModuleDirectory = (0, path_1.join)("node_modules", "@netlify", "plugin-emails", "src");
    fs_1.default.mkdirSync(emailFunctionDirectory, {
        recursive: true,
    });
    fs_1.default.copyFileSync((0, path_1.join)(pluginNodeModuleDirectory, "handler", "index.ts"), (0, path_1.join)(emailFunctionDirectory, "index.ts"));
};
exports.onPreBuild = onPreBuild;
