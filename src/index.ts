import fs from "fs";
import { join } from "path";

export const onPreBuild = (): void => {
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
  fs.mkdirSync(join(emailFunctionDirectory, "mailer"), {
    recursive: true,
  });
  fs.copyFileSync(
    join(pluginNodeModuleDirectory, "handler", "mailer", "index.ts"),
    join(emailFunctionDirectory, "mailer", "index.ts")
  );
  fs.mkdirSync(join(emailFunctionDirectory, "preview"), {
    recursive: true,
  });
  fs.mkdirSync(join(emailFunctionDirectory, "utils"), {
    recursive: true,
  });
  fs.copyFileSync(
    join(pluginNodeModuleDirectory, "handler", "preview", "index.ts"),
    join(emailFunctionDirectory, "preview", "index.ts")
  );
  fs.copyFileSync(
    join(pluginNodeModuleDirectory, "handler", "preview", "preview.html"),
    join(emailFunctionDirectory, "preview", "preview.html")
  );
  fs.copyFileSync(
    join(pluginNodeModuleDirectory, "handler", "preview", "directory.html"),
    join(emailFunctionDirectory, "preview", "directory.html")
  );
  fs.copyFileSync(
    join(pluginNodeModuleDirectory, "handler", "utils", "handlebars.ts"),
    join(emailFunctionDirectory, "utils", "handlebars.ts")
  );
};
