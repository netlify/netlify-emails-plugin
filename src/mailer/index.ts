import { ServerClient } from "postmark";
import sendGrid from "@sendgrid/mail";
import Mailgun from "mailgun.js";
import formData from "form-data";

interface IEmailRequest {
  from: string;
  to: string;
  subject: string;
  html: string;
}

interface IEmailConfig {
  apiKey: string;
  mailgunDomain?: string;
}

interface IMailerProps {
  configuration: IEmailConfig;
  request: IEmailRequest;
}

const mailer = async ({
  configuration,
  request,
}: IMailerProps): Promise<{ status: number; body: string }> => {
  const acceptedProviders = ["mailgun", "postmark", "sendgrid"];
  const emailProvider = process.env.NETLIFY_EMAILS_PROVIDER?.toLowerCase();

  if (emailProvider === undefined) {
    return {
      status: 400,
      body: JSON.stringify("No email provider specified"),
    };
  }

  if (
    acceptedProviders.find(
      (acceptedProvider) => acceptedProvider === emailProvider
    ) === undefined
  ) {
    return {
      status: 404,
      body: JSON.stringify(
        `No supported email provider located for: ${emailProvider}`
      ),
    };
  } else {
    // TODO - Catch and manage errors from each handler and return the error message, with a 500 code
    if (emailProvider === "mailgun") {
      console.log("Sending email using Mailgun...");
      if (configuration.mailgunDomain === undefined) {
        return {
          status: 400,
          body: JSON.stringify(
            "Domain should be specified when using Mailgun email API"
          ),
        };
      }

      const mailgun = new Mailgun(formData);
      const mailgunClient = mailgun.client({
        username: "api",
        key: configuration.apiKey,
        url: "https://api.eu.mailgun.net",
      });

      try {
        const result = await mailgunClient.messages.create(
          configuration.mailgunDomain,
          {
            from: request.from,
            to: request.to,
            subject: request.subject,
            html: request.html,
          }
        );
        console.log(result.status, "status");
      } catch (e) {
        console.log(JSON.stringify(e));
      }
    }
    if (emailProvider === "postmark") {
      console.log("Sending email using Postmark...");
      const client = new ServerClient(configuration.apiKey);

      client.sendEmail({
        From: request.from,
        To: request.to,
        Subject: request.subject,
        HtmlBody: request.html,
      });
    }
    if (emailProvider === "sendgrid") {
      console.log("Sending email using Sendgrid...");
      sendGrid.setApiKey(configuration.apiKey);

      const result = await sendGrid.send({
        from: request.from,
        to: request.to,
        subject: request.subject,
        html: request.html,
      });
    }
    return {
      status: 200,
      body: JSON.stringify("Email sent"),
    };
  }
};

export default mailer;
