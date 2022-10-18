import { exec } from "child_process";
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
  exec(`npm install ${functionDependencies.join(" ")} -D`);
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
    join(__dirname, "handler", "index.js"),
    join(emailFunctionDirectory, "index.js")
  );
  fs.mkdirSync(join(emailFunctionDirectory, "mailer"), {
    recursive: true,
  });
  fs.copyFileSync(
    join(__dirname, "handler", "mailer", "index.js"),
    join(emailFunctionDirectory, "mailer", "index.js")
  );
  fs.mkdirSync(join(emailFunctionDirectory, "preview"), {
    recursive: true,
  });
  fs.mkdirSync(join(emailFunctionDirectory, "utils"), {
    recursive: true,
  });
  fs.copyFileSync(
    join(__dirname, "handler", "preview", "index.js"),
    join(emailFunctionDirectory, "preview", "index.js")
  );
  fs.copyFileSync(
    join(__dirname, "handler", "preview", "preview.html"),
    join(emailFunctionDirectory, "preview", "preview.html")
  );
  fs.copyFileSync(
    join(__dirname, "handler", "preview", "directory.html"),
    join(emailFunctionDirectory, "preview", "directory.html")
  );
  fs.copyFileSync(
    join(__dirname, "handler", "utils", "handlebars.js"),
    join(emailFunctionDirectory, "utils", "handlebars.js")
  );
};
