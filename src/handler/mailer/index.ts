import { ServerClient } from "postmark";
import sendGrid from "@sendgrid/mail";
import Mailgun from "mailgun.js";
import formData from "form-data";

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

interface IMailerProps {
  configuration: IEmailConfig;
  request: IEmailRequest;
}

const mailer = async ({
  configuration,
  request,
}: IMailerProps): Promise<{ statusCode: number; body: string }> => {
  const acceptedProviders = ["mailgun", "postmark", "sendgrid"];
  const emailProvider = configuration.providerName.toLowerCase();

  if (
    acceptedProviders.find(
      (acceptedProvider) => acceptedProvider === emailProvider
    ) === undefined
  ) {
    return {
      statusCode: 404,
      body: JSON.stringify(
        `No supported email provider located for: ${emailProvider}`
      ),
    };
  } else {
    let errorMessage: string | undefined;
    if (emailProvider === "mailgun") {
      console.log("Sending email using Mailgun...");
      if (configuration.mailgunDomain === undefined) {
        return {
          statusCode: 400,
          body: JSON.stringify(
            "NETLIFY_EMAILS_MAILGUN_DOMAIN should be specified when using Mailgun email API"
          ),
        };
      }
      if (configuration.mailgunHostRegion === undefined) {
        console.warn(
          "NETLIFY_EMAILS_MAILGUN_HOST_REGION is not specified, using the default mailgun region which may not work for EU domains"
        );
      }

      const mailgun = new Mailgun(formData);
      const mailgunClient = mailgun.client({
        username: "api",
        key: configuration.apiKey,
        url:
          configuration.mailgunHostRegion?.toLowerCase() === "eu"
            ? "https://api.eu.mailgun.net"
            : undefined,
      });

      try {
        const result = await mailgunClient.messages.create(
          configuration.mailgunDomain,
          {
            from: request.from,
            to: request.to,
            subject: request.subject,
            html: request.html,
            cc: request.cc,
            bcc: request.bcc,
          }
        );
        if (result.status !== 200) {
          errorMessage = `${result.status} - ${result.message ?? ""}`;
        }
      } catch (e) {
        const error = e as { status: number; message: string };
        errorMessage = `${error.status} - ${error.message}`;
      }
    }
    if (emailProvider === "postmark") {
      console.log("Sending email using Postmark...");
      const client = new ServerClient(configuration.apiKey);

      try {
        const result = await client.sendEmail({
          From: request.from,
          To: request.to,
          Subject: request.subject,
          HtmlBody: request.html,
          Cc: request.cc,
          Bcc: request.bcc,
        });

        if (result.ErrorCode !== 0) {
          errorMessage = result.Message;
        }
      } catch (e) {
        const error = e as { statusCode: string; code: string };
        errorMessage = `${error.code} - Failed with status code: ${error.statusCode}`;
      }
    }
    if (emailProvider === "sendgrid") {
      console.log("Sending email using SendGrid...");
      sendGrid.setApiKey(configuration.apiKey);

      try {
        await sendGrid.send({
          from: request.from,
          to: request.to,
          subject: request.subject,
          html: request.html,
          cc: request.cc,
          bcc: request.bcc,
        });
      } catch (e) {
        const error = e as { code: number; message: string };
        errorMessage = `${error.code} - ${error.message}`;
      }
    }

    if (errorMessage !== undefined) {
      console.error(
        `Failed to send email with ${emailProvider}: ${errorMessage}`
      );
      return {
        statusCode: 500,
        body: JSON.stringify(
          `The email API provider ${emailProvider} failed to process the request: ${errorMessage}`
        ),
      };
    }
    console.log(`Email sent successfully using ${emailProvider}`);
    return {
      statusCode: 200,
      body: JSON.stringify(`Email sent successfully using ${emailProvider}`),
    };
  }
};

export default mailer;
