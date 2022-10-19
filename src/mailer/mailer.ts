import fetch, { Response } from "node-fetch";

/**
 * Sends an email request to the Netlify email handler function
 * @param secret - The secret key issued by Netlify to verify requests are authentic
 * @param baseUrl - The base URL that the website is running on
 * @param template - The name of the email template, as located in the email directory
 * @param to - The receipient of the email
 * @param from - The sender of the email. This will need to be an email address that is authorised by the chosen email API provider to send emails.
 * @param subject - The subject line of the email
 * @param parameters - Any handlebar parameters that are included in the email template itself, that require replacing with the given values in this parameter
 * @returns A fetch Response to the email request
 */
const mailer = async ({
  secret,
  baseUrl,
  template,
  to,
  from,
  cc,
  bcc,
  subject,
  parameters,
}: {
  secret: string;
  baseUrl: string;
  template: string;
  to: string;
  from: string;
  cc?: string;
  bcc?: string;
  subject: string;
  parameters: unknown;
}): Promise<Response> => {
  const response = await fetch(
    `${process.env.URL as string}/.netlify/functions/emails/${template}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "netlify-emails-secret": secret,
      },
      body: JSON.stringify({
        from,
        to,
        cc,
        bcc,
        parameters,
        subject,
      }),
    }
  );

  return response;
};
export default mailer;
