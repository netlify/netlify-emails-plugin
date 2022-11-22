import { execSync } from "child_process";
import fs from "fs";
import { join } from "path";
import toml from "toml";

export const onPreBuild = ({
  netlifyConfig,
}: {
  netlifyConfig: {
    build: { environment: { [key: string]: string | boolean } };
    functions: {
      [key: string]: {
        included_files: string[];
        external_node_modules?: string[];
        node_bundler: string;
      };
    };
  };
}): void => {
  console.log(netlifyConfig.functions.emails);

  if (
    process.env.NETLIFY_EMAILS_DIRECTORY === undefined ||
    process.env.NETLIFY_EMAILS_DIRECTORY === ""
  ) {
    throw new Error("NETLIFY_EMAILS_DIRECTORY must be set");
  }

  netlifyConfig.functions.emails = {
    included_files: [`${process.env.NETLIFY_EMAILS_DIRECTORY}/**`],
    node_bundler: "esbuild",
    external_node_modules: ["uglify-js"],
  };

  const functionDependencies = [
    "handlebars",
    "postmark",
    "@sendgrid/mail",
    "form-data",
    "mailgun.js",
    "cheerio",
    "mjml",
  ];

  // If netlify.toml exists in root directory, then add external_node_modules to it
  if (fs.existsSync("netlify.toml")) {
    const netlifyToml = fs.readFileSync("netlify.toml", "utf8");
    const parsedNetlifyToml = toml.parse(netlifyToml);

    // If it doesn't have a functions key, then add it with emails as the key and the value being an object with external_node_modules as the key and uglify-js as the value
    if (parsedNetlifyToml.functions === undefined) {
      fs.appendFileSync(
        "netlify.toml",
        '[functions.emails]\n  external_node_modules = ["uglify-js"]'
      );
    }
    // If the function.emails config doesn't have an external_node_modules key, then add it with uglify-js as the value in the line below functions.emails
    else if (
      parsedNetlifyToml.functions.emails.external_node_modules === undefined
    ) {
      const functionsEmailsIndex = netlifyToml.indexOf("[functions.emails]");
      const functionsEmailsEndIndex = netlifyToml.indexOf(
        "[functions.emails]",
        functionsEmailsIndex + 1
      );
      let functionsEmailsConfig = netlifyToml.slice(
        functionsEmailsIndex,

        functionsEmailsEndIndex
      );
      functionsEmailsConfig += '\n  external_node_modules = ["uglify-js"]';

      // Insert the functions.emails config into the netlify.toml file at the correct index
      fs.appendFileSync("netlify.toml", functionsEmailsConfig);
    }
    // If the Toml has a external_node_modules key that doesn't include uglify-js, then replace that line in the toml and append uglify-js to the end
    else if (
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      !parsedNetlifyToml.functions.emails.external_node_modules?.includes(
        "uglify-js"
      )
    ) {
      const stringifiedModules = (
        parsedNetlifyToml.functions.emails.external_node_modules as string[]
      ).map((module) => `"${module}"`);
      stringifiedModules.push('"uglify-js"');

      const externalNodeModules = stringifiedModules.join(", ");

      // Replace the line in the toml with the new external_node_modules
      fs.writeFileSync(
        "netlify.toml",
        netlifyToml.replace(
          /external_node_modules = \[.*\]/,
          `external_node_modules = [${externalNodeModules}]`
        )
      );
    }
  }

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
