import fs from 'fs';
import path from 'path';
import prettier from 'prettier';
import Handlebars from 'handlebars';
import { Template } from './types';
import processHtml from './processHtml';

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
    fs
      .readFileSync(path.resolve(__dirname, '../templates/email.hbs'))
      .toString()
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

  const result = await processHtml(
    template,
    options,
    emailTemplate({
      isDevelopment: true,
      content: handlebarsTemplate(options.data)
    })
  );

  return prettier.format(result.html, { parser: 'html' });
};
