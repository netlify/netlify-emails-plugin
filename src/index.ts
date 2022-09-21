import { handler } from "./handler/import";
import fs from "fs";
import { join } from "path";

export const onPreBuild = () => {
  const emailFunctionDirectory = join(
    ".netlify",
    "functions-internal",
    "email"
  );
  fs.mkdirSync(emailFunctionDirectory, {
    recursive: true,
  });
  fs.copyFileSync(
    join(
      "node_modules",
      "@netlify",
      "plugin-emails",
      "lib",
      "handler",
      "index.js"
    ),
    join(emailFunctionDirectory, "email.js")
  );
};
