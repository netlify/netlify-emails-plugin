import { Handler } from "@netlify/functions";
import fs from "fs";
import Handlebars from "handlebars";
import { ServerClient } from "postmark";

export const getEmailFromPath = (path: string) => {
  console.log(`Getting the template for: ${path}`);

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
  const emailPath = event.rawUrl.match(/email\/([A-z-]*)[\?]?/)?.[1];
  const params = event.queryStringParameters;
  if (!emailPath) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "No email path provided",
      }),
    };
  }
  if (!params?._from) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "From address is required",
      }),
    };
  }
  if (!params?._to) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Too address is required",
      }),
    };
  }
  const fullEmailPath = `./emails/${emailPath}`;
  const fileContents = getEmailFromPath(fullEmailPath);
  const template = Handlebars.compile(fileContents);
  const renderedTemplate = template(params);

  const serverToken = process.env.EMAIL_API_TOKEN as string;
  const client = new ServerClient(serverToken);

  client.sendEmail({
    From: params?._from,
    To: params?._to,
    Subject: params?._subject ?? "",
    HtmlBody: renderedTemplate,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Email sent using template: ./emails/${emailPath}`,
    }),
  };
};

export { handler };
