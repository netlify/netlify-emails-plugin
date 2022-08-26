import fs from "fs";
import path from "path";
import mjml from "mjml";

const walkDir = (dir: string, callback: (path: string) => void) => {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
};

export const onPreBuild = async () => {
  walkDir("./emails", (filePath) => {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const fileType = filePath.split(".").pop();
    var filename = filePath.replace(/^.*[\\\/]/, "").split(".")[0];
    if (filename === "index") {
      if (fileType === "mjml") {
        console.log("Printing .mjml contents", mjml(fileContents).html);
      }
      if (fileType === "html") {
        console.log("Printing .html contents", fileContents);
      }
    }
  });
};