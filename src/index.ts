import { handler } from "./handler/import";
import fs from "fs";
import { join, parse } from "path";

export const onPreBuild = () => {
  const emailFunctionDirectory = join(
    ".netlify",
    "functions-internal",
    "email"
  );
  const emailTemplatesDirectory = "emails";
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
    join(emailFunctionDirectory, "email.ts")
  );

  const customPreDeliveryJsFileExists = fs.existsSync(
    join(emailTemplatesDirectory, "preDelivery.js")
  );
  const customPreDeliveryTsFileExists = fs.existsSync(
    join(emailTemplatesDirectory, "preDelivery.ts")
  );

  const deletePreviousPredeliveryFiles = () => {
    const internalPreDeliveryJsFileExists = fs.existsSync(
      join(emailFunctionDirectory, "preDelivery.js")
    );
    const internalPreDeliveryTsFileExists = fs.existsSync(
      join(emailFunctionDirectory, "preDelivery.ts")
    );
    if (internalPreDeliveryJsFileExists) {
      fs.unlinkSync(join(emailFunctionDirectory, "preDelivery.js"));
    }
    if (internalPreDeliveryTsFileExists) {
      fs.unlinkSync(join(emailFunctionDirectory, "preDelivery.ts"));
    }
  };

  if (customPreDeliveryJsFileExists || customPreDeliveryTsFileExists) {
    deletePreviousPredeliveryFiles();

    console.log(
      "Custom pre-delivery file detected - handler will be called before emails delivered"
    );
    const preDeliveryFile = join(
      emailTemplatesDirectory,
      customPreDeliveryJsFileExists ? "preDelivery.js" : "preDelivery.ts"
    );
    fs.copyFileSync(
      preDeliveryFile,
      join(
        emailFunctionDirectory,
        `preDelivery${customPreDeliveryJsFileExists ? ".js" : ".ts"}`
      )
    );
  } else {
    deletePreviousPredeliveryFiles();
    fs.copyFileSync(
      join(pluginNodeModuleDirectory, "handler", "preDelivery.js"),
      join(emailFunctionDirectory, "preDelivery.js")
    );
  }
};
