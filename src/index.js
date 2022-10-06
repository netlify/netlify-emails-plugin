"use strict";
exports.__esModule = true;
exports.onPreBuild = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var onPreBuild = function () {
    var emailFunctionDirectory = (0, path_1.join)(".netlify", "functions-internal", "emails");
    var pluginNodeModuleDirectory = (0, path_1.join)("node_modules", "@netlify", "plugin-emails", "src");
    fs_1["default"].mkdirSync(emailFunctionDirectory, {
        recursive: true
    });
    fs_1["default"].copyFileSync((0, path_1.join)(pluginNodeModuleDirectory, "handler", "index.ts"), (0, path_1.join)(emailFunctionDirectory, "index.ts"));
    fs_1["default"].mkdirSync((0, path_1.join)(emailFunctionDirectory, "mailer"), {
        recursive: true
    });
    fs_1["default"].copyFileSync((0, path_1.join)(pluginNodeModuleDirectory, "handler", "mailer", "index.ts"), (0, path_1.join)(emailFunctionDirectory, "mailer", "index.ts"));
};
exports.onPreBuild = onPreBuild;
