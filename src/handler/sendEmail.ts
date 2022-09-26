import CryptoJS from "crypto-js";

const sendEmail = ({
  template,
  to,
  from,
  subject,
  parameters,
  token,
}: {
  template: string;
  to: string;
  from: string;
  subject: string;
  parameters: object;
  token: string;
}) => {
  if (!token) {
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
    token
  ).toString();

  fetch(`./.netlify/functions/email/${template}`, {
    method: "POST",
    body: ciphertext,
  });
};

export default sendEmail;
