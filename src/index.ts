import { handler } from "./handler/import";
import fs from "fs";

export const onPreBuild = async ({
  constants,
}: {
  constants: { FUNCTIONS_SRC: string };
}) => {
  fs.mkdirSync("./netlify/functions/email/");
  // This is a real hack and there may be a better way to inject a function!
  fs.writeFileSync(
    `./netlify/functions/email/index.ts`,
    `import { handler } from "@netlify/plugin-emails/lib/handler/index"; export { handler };`
  );
};
