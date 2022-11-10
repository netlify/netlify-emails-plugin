import { execSync } from "child_process";
import { mkdirSync, copyFileSync } from "fs";
import { join } from "path";

export const onPreBuild = ({
  netlifyConfig,
}: {
  netlifyConfig: { functions: { [key: string]: { included_files: string[] } } };
}): void => {
  if (
    process.env.NETLIFY_EMAILS_DIRECTORY === undefined ||
    process.env.NETLIFY_EMAILS_DIRECTORY === ""
  ) {
    throw new Error("NETLIFY_EMAILS_DIRECTORY must be set");
  }

  netlifyConfig.functions.emails = {
    included_files: [`${process.env.NETLIFY_EMAILS_DIRECTORY}/**`],
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
    "./.netlify",
    "functions-internal",
    "emails"
  );

  mkdirSync(emailFunctionDirectory, {
    recursive: true,
  });

  mkdirSync(join(emailFunctionDirectory, "mailer"), {
    recursive: true,
  });
  mkdirSync(join(emailFunctionDirectory, "preview"), {
    recursive: true,
  });
  mkdirSync(join(emailFunctionDirectory, "utils"), {
    recursive: true,
  });

  copyFileSync(
    join(__dirname, "../src", "handler", "mailer", "index.ts"),
    join(emailFunctionDirectory, "mailer", "index.ts")
  );

  copyFileSync(
    join(__dirname, "../src", "handler", "preview", "index.ts"),
    join(emailFunctionDirectory, "preview", "index.ts")
  );
  copyFileSync(
    join(__dirname, "../src", "handler", "preview", "preview.html"),
    join(emailFunctionDirectory, "preview", "preview.html")
  );
  copyFileSync(
    join(__dirname, "../src", "handler", "preview", "directory.html"),
    join(emailFunctionDirectory, "preview", "directory.html")
  );
  copyFileSync(
    join(__dirname, "../src", "handler", "utils", "handlebars.ts"),
    join(emailFunctionDirectory, "utils", "handlebars.ts")
  );
  console.log("src:", join(__dirname, "../src", "handler", "index.ts"));
  console.log("dest", join(emailFunctionDirectory, "index.ts"));

  copyFileSync(
    join(__dirname, "../src", "handler", "index.ts"),
    join(emailFunctionDirectory, "index.ts")
  );
};
