import posthtml, { PostHTML } from "posthtml";
import inlineCSS from "posthtml-inline-css";
import prettier from "prettier";
import Handlebars from "handlebars";

interface BoxValues {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

const parseBoxValues = (values: string): BoxValues => {
  if (typeof values === "string") {
    const parsedValues = values.split(/\s+/).map(value => parseInt(value));

    switch (parsedValues.length) {
      case 4:
        return {
          top: parsedValues[0],
          left: parsedValues[1],
          bottom: parsedValues[2],
          right: parsedValues[3]
        };

      case 2:
        return {
          top: parsedValues[0],
          left: parsedValues[1],
          bottom: parsedValues[0],
          right: parsedValues[1]
        };

      case 1:
        return {
          top: parsedValues[0],
          left: parsedValues[0],
          bottom: parsedValues[0],
          right: parsedValues[0]
        };

      default:
        throw new Error(`Invalid padding value: "${values}"`);
    }
  }
};

const paddingElement = tree => {
  tree.match({ tag: "padding" }, node => {
    return {
      tag: "table",
      content: [
        {
          tag: "tr",
          content: [
            { tag: "td", attrs: { colspan: "3", height: node.attrs?.top } }
          ]
        },
        {
          tag: "tr",
          content: [
            { tag: "td", attrs: { width: node.attrs?.left } },
            { tag: "td", content: node.content },
            { tag: "td", attrs: { width: node.attrs?.right } }
          ]
        },
        {
          tag: "tr",
          content: [
            { tag: "td", attrs: { colspan: "3", height: node.attrs?.bottom } }
          ]
        }
      ]
    };
  });
};

const paddingAttribute = tree => {
  tree.match({ attrs: { padding: /\d+( \d+){0,3}/ } }, node => {
    const { top, left, bottom, right } = parseBoxValues(node.attrs.padding);

    return {
      tag: "padding",
      attrs: { top, left, bottom, right },
      content: { ...node, attrs: { ...node.attrs, padding: undefined } }
    };
  });
};

const tableElement = tree => {
  tree.match({ tag: "table" }, node => {
    return {
      ...node,
      attrs: { border: "0", cellspacing: "0", cellpadding: "0", ...node.attrs }
    };
  });
};

const render = async (html, data = {}) => {
  const template = Handlebars.compile(html);

  const result = await posthtml([
    inlineCSS("p { color:red; }"),
    paddingAttribute,
    paddingElement,
    tableElement
  ]).process(template(data));

  console.log(prettier.format(result.html, { parser: "html" }));
};

const html = `<p padding="20 30 45 3">{{hello}}</p>`;

render(html, { hello: "world" });
