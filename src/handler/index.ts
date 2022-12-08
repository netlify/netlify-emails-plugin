import { Handler } from "@netlify/functions";
import fs from "fs";
import Handlebars from "handlebars";
import fetch from "node-fetch";
import { join } from "path";

export const getEmailFromPath = (
  path: string
): { file: string; type: string } | undefined => {
  let fileFound: { file: string; type: string } | undefined;
  fs.readdirSync(path).forEach((file) => {
    if (fileFound !== undefined) {
      // break after getting first file
      return;
    }
    const fileType = file.split(".").pop();
    const filename = file.replace(/^.*[\\/]/, "").split(".")[0];
    if (filename === "index") {
      if (fileType === "mjml" || fileType === "html") {
        const fileContents = fs.readFileSync(`${path}/${file}`, "utf8");
        fileFound = { file: fileContents, type: fileType };
      }
    }
  });

  return fileFound;
};

export interface IEmailRequest {
  from: string;
  to: string;
  subject: string;
  html: string;
  cc?: string;
  bcc?: string;
}

interface IEmailConfig {
  apiKey: string;
  providerName: string;
  mailgunDomain?: string;
  mailgunHostRegion?: string;
}

export interface IMailRequest {
  configuration: IEmailConfig;
  request: IEmailRequest;
}

const allowedPreviewEnvironments = ["deploy-preview", "branch-deploy", "dev"];

const handler: Handler = async (event) => {
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
      // Return error if preview path is not a valid email path
      if (!fs.existsSync(join(emailTemplatesDirectory, previewPath))) {
        console.log(
          `Preview path is not a valid email path - preview path received: ${previewPath}`
        );
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: `Preview path is not a valid email path - preview path received: ${previewPath}`,
          }),
        };
      }

      const validEmailPaths: string[] = [];

      const emailTemplate = getEmailFromPath(
        join(emailTemplatesDirectory, previewPath)
      );

      // If no email template found, return error
      if (emailTemplate === undefined) {
        console.log(
          `No email template found for preview path - preview path received: ${previewPath}. Please ensure that an index.mjml or index.html file exists in the email template folder.`
        );
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: `No email template found for preview path - preview path received: ${previewPath}`,
          }),
        };
      }

      // Query parameters as object
      const queryParams = event.queryStringParameters;

      const renderResponse = await fetch(
        "https://netlify-integration-emails.netlify.app/.netlify/functions/render?showParamaterDictionary=true",
        {
          method: "POST",
          headers: {
            "site-id": process.env.SITE_ID as string,
          },
          body: JSON.stringify({
            template: emailTemplate.file,
            type: emailTemplate.type,
            parameters: queryParams,
          }),
        }
      );

      const renderResponseJson = (await renderResponse.json()) as {
        html: string;
        parameterDictionary: string;
      };

      fs.readdirSync(emailTemplatesDirectory).forEach((template) => {
        // If index.html or index.mjml exists inside template folder, add to validEmailPaths
        if (
          fs.existsSync(
            join(emailTemplatesDirectory, template, "index.html")
          ) ||
          fs.existsSync(join(emailTemplatesDirectory, template, "index.mjml"))
        ) {
          validEmailPaths.push(template);
        }
      });

      const emailPreviewResponse = await fetch(
        "https://netlify-integration-emails.netlify.app/.netlify/functions/preview",
        {
          method: "POST",
          headers: {
            "site-id": process.env.SITE_ID as string,
          },
          body: JSON.stringify({
            name: previewPath,
            renderedTemplate: renderResponseJson.html,
            templates: validEmailPaths,
            parametersDictionary: renderResponseJson.parameterDictionary,
          }),
        }
      );

      const emailPreviewResponseJson = (await emailPreviewResponse.json()) as {
        html: string;
      };

      return {
        statusCode: 200,
        body: emailPreviewResponseJson.html,
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "TODO ",
      }),
    };
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

  const response = await fetch(
    "https://test-netlify-integration-emails.netlify.app/.netlify/functions/send",
    {
      method: "POST",
      headers: {
        "site-id": process.env.SITE_ID as string,
      },
      body: JSON.stringify({
        configuration: {
          providerName,
          apiKey: providerApiKey,
          mailgunDomain: process.env.NETLIFY_EMAILS_MAILGUN_DOMAIN,
          mailgunHostRegion: process.env.NETLIFY_EMAILS_MAILGUN_HOST_REGION,
        },
        request: {
          from: requestBody.from,
          to: requestBody.to,
          cc: requestBody.cc,
          bcc: requestBody.bcc,
          subject: requestBody.subject ?? "",
          html: renderedTemplate,
          attachments: requestBody.attachments,
        },
      }),
    }
  );

  const responseText = await response.text();

  return {
    statusCode: response.status,
    body: JSON.stringify({
      message: responseText,
    }),
  };
};

export { handler };
