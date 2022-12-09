import { Handler } from "@netlify/functions";
import fs from "fs";
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

  const showEmailPreview = allowedPreviewEnvironments.includes(
    process.env.CONTEXT as string
  );

  if (event.httpMethod === "GET" && showEmailPreview) {
    let emailTemplate: { file: string; type: string } | undefined;

    if (emailPath !== undefined) {
      // Return error if preview path is not a valid email path
      if (!fs.existsSync(join(emailTemplatesDirectory, emailPath))) {
        console.log(
          `Preview path is not a valid email path - preview path received: ${emailPath}`
        );
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: `Preview path is not a valid email path - preview path received: ${emailPath}`,
          }),
        };
      }

      emailTemplate = getEmailFromPath(
        join(emailTemplatesDirectory, emailPath)
      );

      // If no email template found, return error
      if (emailTemplate === undefined) {
        console.log(
          `No email template found for preview path - preview path received: ${emailPath}. Please ensure that an index.mjml or index.html file exists in the email template folder.`
        );
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: `No email template found for preview path - preview path received: ${emailPath}`,
          }),
        };
      }
    }

    const validEmailPaths: string[] = [];

    fs.readdirSync(emailTemplatesDirectory).forEach((template) => {
      // If index.html or index.mjml exists inside template folder, add to validEmailPaths
      if (
        fs.existsSync(join(emailTemplatesDirectory, template, "index.html")) ||
        fs.existsSync(join(emailTemplatesDirectory, template, "index.mjml"))
      ) {
        validEmailPaths.push(template);
      }
    });

    return {
      statusCode: 200,
      body: `
        <html>
          <head>
          <script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/highlight.min.js"></script>
          <script>
            hljs.highlightAll();
          </script>
          <link rel="stylesheet" href="https://netlify-integration-emails.netlify.app/main.css">
          <script>
            emailPaths =  ${JSON.stringify(validEmailPaths)}
            template = ${JSON.stringify(emailTemplate?.file)}
            templateType = ${JSON.stringify(emailTemplate?.type)}
            siteId = ${JSON.stringify(process.env.SITE_ID)}
          </script>
          <script defer src='https://netlify-integration-emails.netlify.app/index.js'></script>
          </head>
          <div id='app'></div>
        </html>
        `,
      headers: {
        "Content-Type": "text/html",
      },
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

  if (emailPath === undefined) {
    console.error(`Email path is undefined`);
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: `Email path is undefined`,
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

  const email = getEmailFromPath(fullEmailPath);
  if (email === undefined) {
    console.error(`No email file found in directory: ${fullEmailPath}`);
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: `No email file found in directory: ${fullEmailPath}`,
      }),
    };
  }

  const renderResponse = await fetch(
    "https://netlify-integration-emails.netlify.app/.netlify/functions/render?showParamaterDictionary=true",
    {
      method: "POST",
      headers: {
        "site-id": process.env.SITE_ID as string,
      },
      body: JSON.stringify({
        template: email.file,
        type: email.type,
        parameters: requestBody.parameters,
        showParamatersDictionary: false,
      }),
    }
  );

  const renderResponseJson = (await renderResponse.json()) as {
    html: string;
  };

  const renderedTemplate = renderResponseJson.html;

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
