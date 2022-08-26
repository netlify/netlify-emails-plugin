import { Handler } from "@netlify/functions";
import fs from "fs";
import path from "path";
import mjml from "mjml";

export const getEmailFromPath = (path: string) => {
  const emailPath = path.split(".netlify/functions/email/")[1];
  console.log(`getting email for ${emailPath}`);
  const fullEmailPath = `./emails/${emailPath}`;

  let fileContents: string | undefined = undefined;
  fs.readdirSync(fullEmailPath).forEach((file) => {
    if (fileContents !== undefined) {
      // break after getting first file
      return;
    }
    const fileType = file.split(".").pop();
    var filename = file.replace(/^.*[\\\/]/, "").split(".")[0];
    if (filename === "index") {
      if (fileType === "mjml") {
        fileContents = fs.readFileSync(`${fullEmailPath}/${file}`, "utf8");
        console.log("Printing .mjml contents", mjml(fileContents).html);
      }
      if (fileType === "html") {
        fileContents = fs.readFileSync(`${fullEmailPath}/${file}`, "utf8");
        console.log("Printing .html contents", fileContents);
      }
    }
  });

  return fileContents;
};

const handler: Handler = async (event, context) => {
  const emailPath = event.rawUrl.split(".netlify/functions/email/")[0];
  // TODO - this seems hacky - I want to read ./emails from the root directory
  const fullEmailPath = `../../../emails/${emailPath}`;

  const fileContents = getEmailFromPath(fullEmailPath);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: fileContents }),
  };
};

export { handler };
