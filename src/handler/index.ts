import { Handler } from "@netlify/functions";
import fs from "fs";

export const getEmailFromPath = (path: string) => {
  console.log(`Getting template for : ${path}`);

  let fileContents: string | undefined = undefined;
  fs.readdirSync(path).forEach((file) => {
    if (fileContents !== undefined) {
      // break after getting first file
      return;
    }
    const fileType = file.split(".").pop();
    var filename = file.replace(/^.*[\\\/]/, "").split(".")[0];
    if (filename === "index") {
      if (fileType === "html") {
        fileContents = fs.readFileSync(`${path}/${file}`, "utf8");
        console.log("Printing .html contents", fileContents);
      }
    }
  });

  return fileContents;
};

const handler: Handler = async (event, _) => {
  const emailPath = event.rawUrl.split(".netlify/functions/email/")[1];

  const fullEmailPath = `./emails/${emailPath}`;

  const fileContents = getEmailFromPath(fullEmailPath);

  // TODO - Next step is to use the fileContents (the template) and pass in parameters to template and replace handlebars
  return {
    statusCode: 200,
    body: JSON.stringify({ message: fileContents }),
  };
};

export { handler };
