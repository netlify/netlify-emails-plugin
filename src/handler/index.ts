import { Handler } from "@netlify/functions";
import fs from "fs";
import Handlebars from "handlebars";
import mailer from "./mailer";
import { emailDirectoryHandler, emailPreviewHandler } from "./preview";

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

const allowedPreviewEnvironments = ["deploy-preview", "branch-deploy", "dev"];

const handler: Handler = async (event, context) => {
  console.log(`Email handler received email request from path ${event.rawUrl}`);

  const providerApiKey = process.env.NETLIFY_EMAILS_PROVIDER_API_KEY;

  if (providerApiKey === undefined) {
    console.log("An API key must be set for your email provider");
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "An API key must be set for your email provider",
      }),
    };
  }

  const providerName = process.env.NETLIFY_EMAILS_PROVIDER;

  if (providerName === undefined) {
    console.log("An email API provider name must be set");
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "An email API provider name must be set",
      }),
    };
  }

  const emailTemplatesDirectory =
    process.env.NETLIFY_EMAILS_DIRECTORY ?? "./emails";

  const emailPath = event.rawUrl.match(/emails\/([A-z-]*)[?]?/)?.[1];
  if (emailPath === undefined) {
    console.log(
      `No email path provided - email path received: ${event.rawUrl}`
    );
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `No email path provided - email path received: ${event.rawUrl}`,
      }),
    };
  }

  const showEmailPreview = allowedPreviewEnvironments.includes(
    process.env.CONTEXT as string
  );

  if (emailPath === "_preview" && showEmailPreview) {
    const previewPath = event.rawUrl.match(
      /emails\/_preview\/([A-z-]*)[?]?/
    )?.[1];

    if (previewPath !== undefined) {
      return emailPreviewHandler(
        previewPath,
        emailTemplatesDirectory,
        event.queryStringParameters
      );
    }

    return emailDirectoryHandler(emailTemplatesDirectory);
  }

  if (
    process.env.NETLIFY_EMAILS_SECRET === undefined ||
    event.headers["netlify-emails-secret"] !== process.env.NETLIFY_EMAILS_SECRET
  ) {
    console.log("No secret provided or secret does not match");
    return {
      statusCode: 403,
      body: JSON.stringify({
        message: "Request forbidden",
      }),
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

  const requestBody = JSON.parse(event.body);

  if (requestBody.from === undefined) {
    console.log("From address is required");
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "From address is required",
      }),
    };
  }
  if (requestBody.to === undefined) {
    console.log("To address is required");
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "To address is required",
      }),
    };
  }
  const fullEmailPath = `${emailTemplatesDirectory}/${emailPath}`;

  const directoryExists = fs.existsSync(fullEmailPath);
  if (!directoryExists) {
    console.error(`Email directory does not exist: ${fullEmailPath}`);
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: `Email path ${fullEmailPath} does not exist`,
      }),
    };
  }

  const fileContents = getEmailFromPath(fullEmailPath);
  if (fileContents === undefined) {
    console.error(`No email file found in directory: ${fullEmailPath}`);
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: `No email file found in directory: ${fullEmailPath}`,
      }),
    };
  }

  const template = Handlebars.compile(fileContents);
  const renderedTemplate = template(requestBody.parameters);

  const response = await mailer({
    configuration: {
      providerName,
      apiKey: providerApiKey,
      mailgunDomain: process.env.NETLIFY_EMAILS_MAILGUN_DOMAIN,
    },
    request: {
      from: requestBody.from,
      to: requestBody.to,
      cc: requestBody.cc,
      bcc: requestBody.bcc,
      subject: requestBody.subject ?? "",
      attachments: requestBody.attachments,
      html: renderedTemplate,
    },
  });

  return response;
};

export { handler };
