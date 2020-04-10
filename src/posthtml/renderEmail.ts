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
import removeExtraElements from './removeExtraElements';
import { Template } from './types';
import uploadImages from './uploadImages';

interface Options {
  publish: boolean;
  data?: object;
}

export const renderEmail = async (
  template: Template,
  html,
  options: Options = {
    publish: false
  }
) => {
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

  const result = await posthtml(
    [
      syntaxAttribute,
      inlineCSS(),
      section,
      imageElement(template.name),
      tableElement,
      removeExtraElements,
      options.publish ? uploadImages(template) : undefined
    ].filter(Boolean)
  ).process(
    emailTemplate({
      isDevelopment: true,
      content: handlebarsTemplate(options.data)
    })
  );

  return prettier.format(result.html, { parser: 'html' });
};
