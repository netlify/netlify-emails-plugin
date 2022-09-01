import { Handler } from "@netlify/functions";
import fs from "fs";
import Handlebars from "handlebars";
import { ServerClient } from "postmark";

export const getEmailFromPath = (path: string) => {
  console.log(`Getting template for: ${path}`);

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
  const emailPath = event.rawUrl.match(/email\/([A-z]*)[\?]?/)?.[1];
  if (!emailPath) {
    return {
      statusCode: 500,
    };
  }
  const fullEmailPath = `./emails/${emailPath}`;
  const params = event.queryStringParameters;
  const fileContents = getEmailFromPath(fullEmailPath);
  const template = Handlebars.compile(fileContents);
  const renderedTemplate = template(params);

  const serverToken = process.env.EMAIL_TOKEN as string;
  console.log({ serverToken });
  const client = new ServerClient(serverToken);

  client.sendEmail({
    From: "lewis@reflr.io",
    To: "lewis@reflr.io",
    Subject: "Test",
    HtmlBody: renderedTemplate,
  });

  // TODO - Next step is to use the fileContents (the template) and pass in parameters to template and replace handlebars
  return {
    statusCode: 200,
    body: JSON.stringify({ message: renderedTemplate }),
  };
};

export { handler };
