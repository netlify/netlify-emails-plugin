import { Handler } from "@netlify/functions";
import fs from "fs";
import Handlebars from "handlebars";
import mailer from "./mailer";

export const getEmailFromPath = (path: string): string | undefined => {
  let fileContents: string | undefined;
  fs.readdirSync(path).forEach((file) => {
    if (fileContents !== undefined) {
      // break after getting first file
      return;
    }
    const fileType = file.split(".").pop();
    const filename = file.replace(/^.*[\\/]/, "").split(".")[0];
    if (filename === "index") {
      if (fileType === "html") {
        fileContents = fs.readFileSync(`${path}/${file}`, "utf8");
      }
    }
  });

  return fileContents;
};

const handler: Handler = async (event, context) => {
  console.log(`Email handler received email request from path ${event.rawUrl}`);
  const emailTemplatesDirectory =
    process.env.NETLIFY_EMAILS_DIRECTORY_OVERRIDE ?? "./emails";

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Method not allowed",
      }),
      headers: {
        Allow: "POST",
      },
    };
  }

  if (event.body === null) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Body required",
      }),
    };
  }

  const emailPath = event.rawUrl.match(/emails\/([A-z-]*)[?]?/)?.[1];
  if (emailPath === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `No email path provided - email path received: ${event.rawUrl}`,
      }),
    };
  }

  if (
    process.env.NETLIFY_EMAILS_SECRET === undefined ||
    event.headers["netlify-emails-secret"] !== process.env.NETLIFY_EMAILS_SECRET
  ) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "Request forbidden",
      }),
    };
  }

  const requestBody = JSON.parse(event.body);

  if (requestBody._from !== undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "From address is required",
      }),
    };
  }
  if (requestBody._to !== undefined) {
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

  const providerApiKey = process.env.NETLIFY_EMAILS_PROVIDER_API_KEY;

  if (providerApiKey === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "An API key must be set for your email provider",
      }),
    };
  }

  const providerName = process.env.NETLIFY_EMAILS_PROVIDER;

  if (providerName === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "An email API provider name must be set",
      }),
    };
  }

  const response = await mailer({
    configuration: {
      providerName,
      apiKey: providerApiKey,
      mailgunDomain: process.env.NETLIFY_EMAILS_MAILGUN_DOMAIN,
    },
    request: {
      from: requestBody._from,
      to: requestBody._to,
      subject: requestBody._subject ?? "",
      html: renderedTemplate,
    },
  });

  return response;
};

export { handler };
