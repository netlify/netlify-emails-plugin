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
exports.onPreBuild = void 0;
const fs_1 = __importDefault(require("fs"));
const onPreBuild = ({ constants, }) => __awaiter(void 0, void 0, void 0, function* () {
    fs_1.default.mkdirSync("./netlify/functions/email/", { recursive: true });
    // This is a real hack and there may be a better way to inject a function!
    fs_1.default.writeFileSync(`./netlify/functions/email/index.ts`, `import { handler } from "@netlify/plugin-emails/lib/handler/index"; export { handler };`);
});
exports.onPreBuild = onPreBuild;
