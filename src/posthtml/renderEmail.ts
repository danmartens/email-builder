import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import Handlebars from 'handlebars';
import { Template } from './types';
import processHtml from './processHtml';

interface Options {
  publish: boolean;
  uploadImages: boolean;
  stripMediaQueries: boolean;
  context?: object;
}

Handlebars.registerHelper('preview-text', (text: string) => {
  let whitespace = '';

  for (let i = text.length; i <= 270; i += 2) {
    whitespace += '&zwnj;&nbsp;';
  }

  return new Handlebars.SafeString(
    `<div style="display: none; max-height: 0px; overflow: hidden;">${text}</div>\n` +
      `<div style="display: none; max-height: 0px; overflow: hidden;">${whitespace}</div>`
  );
});

const generateHeadHtml = (template: Template, options: Options) => {
  if (template.rootPath == null) {
    return;
  }

  const headTemplatePath = path.join(template.rootPath, 'head.hbs');

  if (!fs.existsSync(headTemplatePath)) {
    return;
  }

  return Handlebars.compile(fs.readFileSync(headTemplatePath).toString())(
    options.context
  );
};

export const renderEmail = async (
  template: Template,
  html: string,
  options: Options = {
    publish: false,
    uploadImages: false,
    stripMediaQueries: false
  }
): Promise<string> => {
  const emailTemplate = Handlebars.compile(
    fs
      .readFileSync(path.resolve(__dirname, '../templates/email.hbs'))
      .toString()
  );

  const contentTemplate = Handlebars.compile(html);

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

  const result = await processHtml(
    template,
    options,
    emailTemplate({
      isDevelopment: true,
      content: contentTemplate(options.context),
      head: generateHeadHtml(template, options)
    })
  );

  if (options.publish) {
    return result.html;
  }

  return prettier.format(result.html, { parser: 'html' });
};
