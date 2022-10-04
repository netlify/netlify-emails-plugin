import { Handler } from "@netlify/functions";
import fs from "fs";
import Handlebars from "handlebars";
import { ServerClient } from "postmark";

export const getEmailFromPath = (path: string): string | undefined => {
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
      }
    }
  });

  return fileContents;
};

const handler: Handler = async (event, context) => {
  const emailTemplatesDirectory =
    process.env.NETLIFY_EMAILS_DIRECTORY_OVERRIDE ?? "./emails";

  console.log(
    { emailTemplatesDirectory },
    process.env.NETLIFY_EMAILS_DIRECTORY_OVERRIDE
  );

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 400,
      body: "METHOD NOT ALLOWED",
      headers: {
        Allow: "POST",
      },
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Body required",
      }),
    };
  }

  const emailPath = event.rawUrl.match(/email\/([A-z-]*)[\?]?/)?.[1];
  if (!emailPath) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "No email path provided",
      }),
    };
  }

  if (
    process.env.NETLIFY_EMAILS_TOKEN === undefined ||
    event.headers["netlify-email-token"] !== process.env.NETLIFY_EMAILS_TOKEN
  ) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to process request",
      }),
    };
  }

  const requestBody = JSON.parse(event.body);

  if (!requestBody.from) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "From address is required",
      }),
    };
  }
  if (!requestBody.to) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "To address is required",
      }),
    };
  }
  const fullEmailPath = `${emailTemplatesDirectory}/${emailPath}`;
  const fileContents = getEmailFromPath(fullEmailPath);
  const template = Handlebars.compile(fileContents);
  const renderedTemplate = template(requestBody.parameters);

  const serverToken = process.env.NETLIFY_EMAIL_API_TOKEN as string;
  const client = new ServerClient(serverToken);

  client.sendEmail({
    From: requestBody.from,
    To: requestBody.to,
    Subject: requestBody.subject ?? "",
    HtmlBody: renderedTemplate,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Email sent using template: ${emailTemplatesDirectory}/${emailPath}`,
    }),
  };
};

export { handler };
