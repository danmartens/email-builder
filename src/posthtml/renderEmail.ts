import fs from 'fs';
import path from 'path';
import posthtml from 'posthtml';
import inlineCSS from 'posthtml-inline-css';
import prettier from 'prettier';
import Handlebars from 'handlebars';
import tableElement from './tableElement';
import imageElement from './imageElement';
import section from './section';
import syntaxAttribute from './syntaxAttribute';
import removeUselessElements from './removeUselessElements';
// const addUniqueId = (node: Node)=> {
//   if (node.attrs?.id != null) {
//     return node;
//   }

//   return {
//     ...node,
//     attrs: {
//       ...node.attrs,
//       id:
//     }
//   }
// }
// const reverseMergeAttrs = (attrs: object, node: Node): Node => {
//   return {
//     ...node,
//     attrs: {
//       ...attrs,
//       ...(node.attrs ?? {})
//     }
//   };
// };

// const getAttr = (node: Node, attr: string): string | undefined => {
//   if (node.attrs == null) {
//     return;
//   }

//   return node.attrs[attr];
// };

// const hasClass = (node: Node, className: string) => {
//   return node.attrs?.class?.split(/\s+/)?.includes(className) || false;
// };

import { Template } from './types';

export const renderEmail = async (template: Template, html, data = {}) => {
  const emailTemplate = Handlebars.compile(
    fs.readFileSync(path.join(__dirname, 'email.hbs')).toString()
  );

  const handlebarsTemplate = Handlebars.compile(html);

  if (template.rootPath != null) {
    const partialsDirectoryPath = path.join(template.rootPath, 'partials');

    if (fs.existsSync(partialsDirectoryPath)) {
      const handlebarsPartialPaths = fs
        .readdirSync(partialsDirectoryPath)
        .map((item) => path.join(partialsDirectoryPath, item))
        .filter((item) => fs.statSync(item).isFile());

      for (const partialPath of handlebarsPartialPaths) {
        Handlebars.registerPartial(
          path.basename(partialPath.replace(/\.hbs$/, '')),
          Handlebars.compile(fs.readFileSync(partialPath).toString())
        );
      }
    }
  }

  const result = await posthtml([
    syntaxAttribute,
    inlineCSS(),
    section,
    imageElement(template.name),
    tableElement,
    removeUselessElements
  ]).process(
    emailTemplate({ isDevelopment: true, content: handlebarsTemplate(data) })
  );

  return prettier.format(result.html, { parser: 'html' });
};
