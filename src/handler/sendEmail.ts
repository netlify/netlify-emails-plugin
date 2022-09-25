import CryptoJS from "crypto-js";

const sendEmail = ({
  template,
  to,
  from,
  subject,
  parameters,
}: {
  template: string;
  to: string;
  from: string;
  subject: string;
  parameters: object;
}) => {
  if (
    process.env.NETLIFY_EMAILS_TOKEN ||
    process.env.NEXT_PUBLIC_NETLIFY_EMAILS_TOKEN === undefined
  ) {
    throw new Error("Emails token must be set");
  }

  const emailRequestBody = {
    _to: to,
    _from: from,
    _subject: subject,
    ...parameters,
  };

  const ciphertext = CryptoJS.AES.encrypt(
    JSON.stringify(emailRequestBody),
    process.env.NETLIFY_EMAILS_TOKEN ??
      process.env.NEXT_PUBLIC_NETLIFY_EMAILS_TOKEN
  ).toString();

  fetch(`./.netlify/functions/email/${template}`, {
    method: "POST",
    body: ciphertext,
  });
};

export default sendEmail;
