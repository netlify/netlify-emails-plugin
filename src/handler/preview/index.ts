import fs from "fs";
import { join } from "path";
import * as cheerio from "cheerio";
import { getHBValues } from "../utils/handlebars";
import mjml2html from "mjml";
import Handlebars from "handlebars";

const capitalizeFirstLetter = (string: string): string =>
  string.charAt(0).toUpperCase() + string.slice(1);

export const emailDirectoryHandler = (
  emailDirectory: string
): { statusCode: number; body: string } => {
  const emails: string[] = [];

  try {
    fs.readdirSync(`./${emailDirectory}`).forEach((folder) => {
      if (fs.existsSync(`./${emailDirectory}/${folder}/index.html`)) {
        emails.push(`/${folder}`);
      } else if (fs.existsSync(`./${emailDirectory}/${folder}/index.mjml`)) {
        emails.push(`/${folder}`);
      }
    });
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        `Unable to read emails from email directory '${emailDirectory}'. Please ensure this directory exists or change the email directory by updating the NETLIFY_EMAILS_DIRECTORY environment variable.`
      ),
    };
  }

  let templateList = "";
  emails.forEach((email) => {
    templateList += `<li class="flex flex-row justify-between items-center mt-4 list-none"><a class="flex flex-row justify-between items-center rounded w-full px-4 py-2 hover:cursor hover:bg-gray-200" href='${`./_preview${email}`}'>${email.replace(
      "/",
      ""
    )}
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
       <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
    </svg>
    </a>
    </li>`;
  });
  const previewHtml = fs.readFileSync(
    join(
      ".netlify",
      "functions-internal",
      "emails",
      "preview",
      "directory.html"
    )
  );
  const $ = cheerio.load(previewHtml.toString());
  $("#templateList").html(templateList);

  return {
    statusCode: 200,
    body: $.html(),
  };
};

export const emailPreviewHandler = (
  email: string,
  emailDirectory: string,
  queryParameters:
    | {
        [name: string]: string | undefined;
      }
    | null
    | undefined
): { statusCode: number; body: string } => {
  const emails: string[] = [];
  try {
    fs.readdirSync(`./${emailDirectory}`).forEach((folder) => {
      if (fs.existsSync(`./${emailDirectory}/${folder}/index.html`)) {
        emails.push(`/${folder}`);
      } else if (fs.existsSync(`./${emailDirectory}/${folder}/index.mjml`)) {
        emails.push(`/${folder}`);
      }
    });
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        `Unable to read emails from email directory '${emailDirectory}'. Please ensure this directory exists or change the email directory by updating the NETLIFY_EMAILS_DIRECTORY environment variable.`
      ),
    };
  }

  let emailTemplateFile: string | undefined;
  try {
    if (fs.existsSync(`./${emailDirectory}/${email}/index.html`)) {
      emailTemplateFile = fs
        .readFileSync(`./${emailDirectory}/${email}/index.html`)
        .toString();
    } else if (fs.existsSync(`./${emailDirectory}/${email}/index.mjml`)) {
      emailTemplateFile = mjml2html(
        fs.readFileSync(`./${emailDirectory}/${email}/index.mjml`).toString()
      ).html;
    }
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        `Template not found for '${emailDirectory}/${email}'. A file called 'index.html' or 'index.mjml' must exist within this folder.`
      ),
    };
  }

  if (emailTemplateFile === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        `Template not found for '${emailDirectory}/${email}'. A file called 'index.html' or 'index.mjml' must exist within this folder.`
      ),
    };
  }
  const template = Handlebars.compile(emailTemplateFile.toString());
  const hbValues = getHBValues(emailTemplateFile.toString());
  const parameters = Object.keys(hbValues).map((key) => {
    const value = hbValues[key];
    if (Array.isArray(value)) {
      return [key, "array"];
    }

    return [key, "string"];
  });
  const convertedParams: any = {};
  queryParameters !== null &&
    queryParameters !== undefined &&
    Object.keys(queryParameters).forEach((param) => {
      if (param.includes("_array")) {
        const queryValue = queryParameters[param];
        if (queryValue !== undefined) {
          convertedParams[param.replace("_array", "")] = queryValue
            .toString()
            .split(",");
        }
      } else {
        convertedParams[param] = queryParameters[param];
      }
    });
  const renderedTemplate = template(convertedParams, {});

  let paramsHtml = "";

  parameters.forEach((param) => {
    if (param[1] === "array") {
      paramsHtml += `<li><div class='w-[100px] inline-block mt-2'>${capitalizeFirstLetter(
        param[0]
      )}(array):</div> <input  id='${param[0]}_array' name='${
        param[0]
      }_array' type='text' class='block border rounded border-gray-400 w-full px-4 py-2 text-black' placeholder='Enter comma separated values' /></li>`;
    }
    if (param[1] === "string") {
      paramsHtml += `<li><div class='w-[100px] inline-block mt-2'>${capitalizeFirstLetter(
        param[0]
      )}:</div> <input  id='${param[0]}' name='${
        param[0]
      }'  type='text' class='block border rounded border-gray-400 w-full px-4 py-2 text-black' /></li>`;
    }
  });

  const fetchSnippet = `await fetch(
  \`\${process.env.URL}/.netlify/functions/emails/${email}\`,
  {
    headers: {
      "netlify-emails-secret": process.env.NETLIFY_EMAILS_SECRET,
    },
    method: "POST",
    body: JSON.stringify({
      from: "",
      to: "",
      subject: "",
      parameters: {
        ${parameters
          .map((param) => {
            if (param[1] === "array") {
              return `${param[0]}: []`;
            }
            if (param[1] === "string") {
              return `${param[0]}: ""`;
            }
            return "";
          })
          .join(", \n            ")}
      },
    }),
  }
);`;

  let templateList = "";
  emails.forEach((email) => {
    templateList += `<li ><a class='text-white' href='.${email}'>${email.replace(
      "/",
      ""
    )}</a></li>`;
  });
  const previewHtml = fs.readFileSync(
    join(".netlify", "functions-internal", "emails", "preview", "preview.html")
  );
  const $ = cheerio.load(previewHtml.toString());
  $("#templateList").html(templateList);
  $("#parameterList").html(paramsHtml);
  $("#emailPreview").attr("srcdoc", renderedTemplate);
  $("#parameterForm").attr("action", `./${email}`);
  $("#fetchSnippet").html(fetchSnippet);

  return {
    statusCode: 200,
    body: $.html(),
  };
};
