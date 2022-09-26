import { Handler } from "@netlify/functions";
import fs from "fs";
import Handlebars from "handlebars";
import { ServerClient } from "postmark";
import CryptoJS from "crypto-js";
import preDelivery from "./preDelivery";

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
  try {
    preDelivery(Object.freeze(event), Object.freeze(context));
  } catch (e) {
    return {
      statusCode: 400,
      body: `Pre-delivery validation failed: ${(e as Error).message}`,
      headers: {
        Allow: "POST",
      },
    };
  }
  console.log(event.httpMethod);

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

  if (process.env.NETLIFY_EMAILS_TOKEN === undefined) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Unable to decrypt body - No token set during build process",
      }),
    };
  }

  let bytes: CryptoJS.lib.WordArray;
  try {
    bytes = CryptoJS.AES.decrypt(event.body, process.env.NETLIFY_EMAILS_TOKEN);
  } catch {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message:
          "Failed to decrypt body. Check you are using the correct token",
      }),
    };
  }

  const requestBody = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

  if (!requestBody._from) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "From address is required",
      }),
    };
  }
  if (!requestBody._to) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "To address is required",
      }),
    };
  }
  const fullEmailPath = `./emails/${emailPath}`;
  const fileContents = getEmailFromPath(fullEmailPath);
  const template = Handlebars.compile(fileContents);
  const renderedTemplate = template(requestBody);

  const serverToken = process.env.EMAIL_API_TOKEN as string;
  const client = new ServerClient(serverToken);

  client.sendEmail({
    From: requestBody._from,
    To: requestBody._to,
    Subject: requestBody._subject ?? "",
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
