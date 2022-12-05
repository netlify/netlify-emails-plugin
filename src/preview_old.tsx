import fs from "fs";
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import Handlebars from "handlebars";
import { getHBValues } from "./handler/utils/handlebars";
/** @jsx h */

const capitalizeFirstLetter = (string: string): string =>
  string.charAt(0).toUpperCase() + string.slice(1);

const EmailDirectory = ({ path }: { path: string }): h.JSX.Element => {
  const [renderedTemplate, setRenderedTemplate] = useState<string>();
  const [formData, setFormData] = useState<any>();

  const emailDirectory = process.env.NETLIFY_EMAILS_DIRECTORY ?? "./emails";

  const emails: string[] = [];

  try {
    fs.readdirSync(`./${emailDirectory}`).forEach((folder) => {
      if (fs.existsSync(`./${emailDirectory}/${folder}/index.html`)) {
        emails.push(`/${folder}`);
      }
    });
  } catch (e) {
    return <div>Could not find emails directory</div>;
  }

  const copySnippet = (): void => {
    console.log("copying snippet");
  };

  let emailTemplateFile: string;
  try {
    emailTemplateFile = fs
      .readFileSync(`./${emailDirectory}/${path}/index.html`)
      .toString();
  } catch (e) {
    return (
      <>
        Template not found for '${emailDirectory}/${path}'. A file called
        'index.html' must exist within this folder.
      </>
    );
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

  //   const convertedParams: any = {};
  //   queryParameters !== null &&
  //     queryParameters !== undefined &&
  //     Object.keys(queryParameters).forEach((param) => {
  //       if (param.includes("_array")) {
  //         const queryValue = queryParameters[param];
  //         if (queryValue !== undefined) {
  //           convertedParams[param.replace("_array", "")] = queryValue
  //             .toString()
  //             .split(",");
  //         }
  //       } else {
  //         convertedParams[param] = queryParameters[param];
  //       }
  //     });

  useEffect(() => {
    const renderedTemplate = template({}, {});
    setRenderedTemplate(renderedTemplate);
  }, []);

  useEffect(() => {
    console.log(formData);
  }, [formData]);

  const handleParameterSubmit = (e: any): boolean => {
    e.preventDefault();
    setFormData(e);
    return false;
  };

  const clicked = (): void => {
    console.log("clicked");
  };

  return (
    <>
      <script src="https://cdn.tailwindcss.com"></script>
      {/* <script>
    function copySnippet() {
      var r = document.createRange();
      r.selectNode(document.getElementById("fetchSnippet"));
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(r);

      document.execCommand("copy");
      window.getSelection().removeAllRanges();
    }
  </script> */}
      <link
        rel="stylesheet"
        href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/styles/monokai-sublime.min.css"
      />
      <script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/highlight.min.js"></script>
      <script>hljs.highlightAll();</script>
      <title>Email Preview</title>
      <div class="flex flex-row h-full">
        <div class="flex flex-col p-7 text-white bg-[#1c2126] min-w-[240px]">
          <a href="/" class="w-[100px] mb-10">
            <img
              src="https://www.netlify.com/v3/img/components/full-logo-dark.png"
              class="min-w-[100px]"
            />
          </a>
          <div>
            <ul id="templateList"></ul>
          </div>
        </div>
        <div class="grow bg-white border-r-[1px] border-[#1c21261a]">
          <div class="p-3 z-30 w-full sticky bg-white shadow shadow-gray">
            Parameters
          </div>
          <div class="px-10 py-5 flex flex-col">
            <div class="max-w-[450px] bg-white border border-gray-300 rounded-lg shadow shadow-gray flex flex-col mt-6 min-w-full p-6">
              <h2 class="text-l font-semibold">
                Preview the {path} email template with parameters
              </h2>

              <button onClick={clicked}>TEST</button>
              <form
                onSubmit={handleParameterSubmit}
                id="parameterForm"
                class="flex flex-col text-gray-400"
              >
                <ul id="parameterList" class="list-none p-0">
                  {parameters.map((param) => {
                    if (param[1] === "array") {
                      return (
                        <li>
                          <div class="w-[100px] inline-block mt-2">
                            {capitalizeFirstLetter(param[0])}(array):
                          </div>{" "}
                          <input
                            id={`${param[0]}_array`}
                            name={`${param[0]}_array`}
                            type="text"
                            class="block border rounded border-gray-400 w-full px-4 py-2 text-black"
                            placeholder="Enter comma separated values"
                          />
                        </li>
                      );
                    }
                    if (param[1] === "string") {
                      return (
                        <li>
                          <div class="w-[100px] inline-block mt-2">
                            {capitalizeFirstLetter(param[0])}:
                          </div>{" "}
                          <input
                            id={`${param[0]}`}
                            name={`${param[0]}`}
                            type="text"
                            class="block border rounded border-gray-400 w-full px-4 py-2 text-black"
                          />
                        </li>
                      );
                    }
                    return null;
                  })}
                </ul>
                <button
                  class="mt-2 px-4 py-2 bg-[#5cebdf] text-[#054861] rounded-md text-center hover:bg-[#9ff9e1]"
                  type="submit"
                >
                  Preview
                </button>
              </form>
            </div>

            <div class="max-w-[450px] bg-white border border-gray-300 rounded-lg shadow shadow-gray flex flex-col mt-6 min-w-full p-6">
              <div class="flex flex-row justify-between items-center mb-2">
                <h2 class="text-l font-semibold">Fetch.js</h2>
                <button
                  onClick={copySnippet}
                  class="px-4 py-2 bg-[#5cebdf] text-[#054861] rounded-md text-center hover:bg-[#9ff9e1]"
                >
                  Copy
                </button>
              </div>
              <pre class="h-[274px]">
                <code
                  class="overflow-x-hidden h-[250px] language-js"
                  id="fetchSnippet"
                ></code>
              </pre>
            </div>
          </div>
        </div>
        <div class="grow-[3]">
          <div class="p-3 z-30 w-full sticky bg-white shadow shadow-gray">
            Preview
          </div>
          <iframe
            id="emailPreview"
            srcDoc={renderedTemplate}
            class="w-full border-none h-screen"
          />
        </div>
      </div>
    </>
  );
};

export default EmailDirectory;
