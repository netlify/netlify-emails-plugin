import { set } from "lodash";

export const getHBValues = (text: string): { [key: string]: string | [] } => {
  const re = /{{{?(.*?)}?}}/g;
  const tags = [];
  let matches;

  // eslint-disable-next-line no-extra-boolean-cast
  while (Boolean((matches = re.exec(text)))) {
    if (matches !== null) {
      tags.push(matches[1]);
    }
  }
  const root = {};
  let context: any = root;
  const stack: object[] = [];
  const setVar = (variable: string, val: string | true): void => {
    // Dot Notation Breakdown
    if (/\.+/.test(variable) && !/\s/.test(variable)) {
      const notation = variable.split(".");
      set(context, notation, "");
    } else {
      context[variable.trim()] = val;
    }
  };
  tags.forEach((tag) => {
    if (tag.startsWith("! ")) {
      return;
    }
    if (tag === "else") {
      return;
    }
    if ("#^".includes(tag[0]) && !tag.includes(" ")) {
      setVar(tag.slice(1), true);
      stack.push(context);
      return;
    }
    if (tag.startsWith("#if")) {
      const vars = tag.split(" ").slice(1);

      vars.forEach((ivar) => {
        setVar(ivar, true);
      });
      stack.push(context);
      return;
    }
    if (tag.startsWith("/if")) {
      context = stack.pop();
      return;
    }
    if (tag.startsWith("#with ")) {
      const splitTag = tag.split(" ");
      const newContext = {};
      context[splitTag[1]] = newContext;
      stack.push(context);
      context = newContext;
      return;
    }
    if (tag.startsWith("/with")) {
      context = stack.pop();
      return;
    }
    if (tag.startsWith("#unless ")) {
      const splitTag = tag.split(" ");
      setVar(splitTag[1], true);
      stack.push(context);
      return;
    }
    if (tag.startsWith("/unless")) {
      context = stack.pop();
      return;
    }
    if (tag.startsWith("#each ")) {
      const splitTag = tag.split(" ");
      const newContext = {};
      context[splitTag[1]] = [newContext];
      stack.push(context);
      context = newContext;
      return;
    }
    if (tag.startsWith("/each")) {
      context = stack.pop();
      return;
    }
    if (tag.startsWith("/")) {
      context = stack.pop();
      return;
    }
    setVar(tag, "");
  });

  return root;
};
