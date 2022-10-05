import fs from "fs";
import { join } from "path";

export const onPreBuild = () => {
  const emailFunctionDirectory = join(
    ".netlify",
    "functions-internal",
    "emails"
  );
  const pluginNodeModuleDirectory = join(
    "node_modules",
    "@netlify",
    "plugin-emails",
    "src"
  );
  fs.mkdirSync(emailFunctionDirectory, {
    recursive: true,
  });
  fs.copyFileSync(
    join(pluginNodeModuleDirectory, "handler", "index.ts"),
    join(emailFunctionDirectory, "index.ts")
  );
};
