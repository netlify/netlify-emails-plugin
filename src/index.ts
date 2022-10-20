import { execSync } from "child_process";
import fs from "fs";
import { join } from "path";

export const onPreBuild = ({
  netlifyConfig,
}: {
  netlifyConfig: { functions: { [key: string]: { included_files: string[] } } };
}): void => {
  netlifyConfig.functions.emails = {
    included_files: [`${process.env.NETLIFY_EMAILS_DIRECTORY as string}/**`],
  };
  const functionDependencies = [
    "handlebars",
    "postmark",
    "@sendgrid/mail",
    "form-data",
    "mailgun.js",
    "cheerio",
  ];

  console.log("Installing email function dependencies");
  execSync(`npm install ${functionDependencies.join(" ")} -D`);
  console.log("Installed email function dependencies");

  const emailFunctionDirectory = join(
    ".netlify",
    "functions-internal",
    "emails"
  );

  fs.mkdirSync(emailFunctionDirectory, {
    recursive: true,
  });
  fs.copyFileSync(
    join(__dirname, "../src", "handler", "index.ts"),
    join(emailFunctionDirectory, "index.ts")
  );
  fs.mkdirSync(join(emailFunctionDirectory, "mailer"), {
    recursive: true,
  });
  fs.copyFileSync(
    join(__dirname, "../src", "handler", "mailer", "index.ts"),
    join(emailFunctionDirectory, "mailer", "index.ts")
  );
  fs.mkdirSync(join(emailFunctionDirectory, "preview"), {
    recursive: true,
  });
  fs.mkdirSync(join(emailFunctionDirectory, "utils"), {
    recursive: true,
  });
  fs.copyFileSync(
    join(__dirname, "../src", "handler", "preview", "index.ts"),
    join(emailFunctionDirectory, "preview", "index.ts")
  );
  fs.copyFileSync(
    join(__dirname, "../src", "handler", "preview", "preview.html"),
    join(emailFunctionDirectory, "preview", "preview.html")
  );
  fs.copyFileSync(
    join(__dirname, "../src", "handler", "preview", "directory.html"),
    join(emailFunctionDirectory, "preview", "directory.html")
  );
  fs.copyFileSync(
    join(__dirname, "../src", "handler", "utils", "handlebars.ts"),
    join(emailFunctionDirectory, "utils", "handlebars.ts")
  );
};
