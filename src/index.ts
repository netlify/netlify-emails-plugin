import fs from "fs";
import { join } from "path";

export const onPreBuild = (): void => {
  const emailFunctionDirectory = join(
    ".netlify",
    "functions-internal",
    "emails"
  );
  const pluginNodeModuleDirectory = join(
    ".netlify",
    "plugins",
    "node_modules",
    "@netlify",
    "plugin-emails",
    "lib"
  );

  fs.mkdirSync(emailFunctionDirectory, {
    recursive: true,
  });
  fs.copyFileSync(
    join(pluginNodeModuleDirectory, "handler", "index.js"),
    join(emailFunctionDirectory, "index.js")
  );
  fs.mkdirSync(join(emailFunctionDirectory, "mailer"), {
    recursive: true,
  });
  fs.copyFileSync(
    join(pluginNodeModuleDirectory, "handler", "mailer", "index.js"),
    join(emailFunctionDirectory, "mailer", "index.js")
  );
  fs.mkdirSync(join(emailFunctionDirectory, "preview"), {
    recursive: true,
  });
  fs.mkdirSync(join(emailFunctionDirectory, "utils"), {
    recursive: true,
  });
  fs.copyFileSync(
    join(pluginNodeModuleDirectory, "handler", "preview", "index.js"),
    join(emailFunctionDirectory, "preview", "index.js")
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
    join(pluginNodeModuleDirectory, "handler", "utils", "handlebars.js"),
    join(emailFunctionDirectory, "utils", "handlebars.js")
  );
};
