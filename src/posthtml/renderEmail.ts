import fs from 'node:fs/promises';
import path from 'node:path';

import Handlebars from 'handlebars';
import { compact } from 'lodash-es';
import prettier from 'prettier';

import { processHtml } from './processHtml';
import type { Template } from './types';

interface Options {
  publish: boolean;
  uploadImages: boolean;
  stripPadding: boolean;
  stripCustomFonts: boolean;
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
      `<div style="display: none; max-height: 0px; overflow: hidden;">${whitespace}</div>`,
  );
});

export async function renderEmail(
  template: Template,
  html: string,
  options: Options = {
    publish: false,
    uploadImages: false,
    stripPadding: false,
    stripCustomFonts: false,
    stripMediaQueries: false,
  },
): Promise<string> {
  const emailTemplate = Handlebars.compile(
    await fs.readFile(
      path.resolve(__dirname, '../templates/email.hbs'),
      'utf8',
    ),
  );

  const contentTemplate = Handlebars.compile(html);

  if (template.rootPath != null) {
    const partialsDirectoryPath = path.join(template.rootPath, 'partials');

    let partialFilenames: string[];

    try {
      partialFilenames = await fs.readdir(partialsDirectoryPath);
    } catch {
      partialFilenames = [];
    }

    const handlebarsPartialPaths = compact(
      await Promise.all(
        partialFilenames.map(async (item) => {
          const fullPath = path.join(partialsDirectoryPath, item);

          return (await fs.stat(fullPath)).isFile() ? fullPath : null;
        }),
      ),
    );

    for (const partialPath of handlebarsPartialPaths) {
      Handlebars.registerPartial(
        path.basename(partialPath.replace(/\.hbs$/, '')),
        Handlebars.compile(await fs.readFile(partialPath, 'utf8')),
      );
    }
  }

  const result = await processHtml(
    template,
    options,
    emailTemplate({
      isDevelopment: true,
      content: contentTemplate(options.context),
      head: await generateHeadHtml(template, options),
    }),
  );

  if (options.publish) {
    return result.html;
  }

  return prettier.format(result.html, { parser: 'html' });
}

async function generateHeadHtml(template: Template, options: Options) {
  if (template.rootPath == null) {
    return;
  }

  const headTemplatePath = path.join(template.rootPath, 'head.hbs');

  let headContent: string;
  try {
    headContent = await fs.readFile(headTemplatePath, 'utf8');
  } catch {
    return;
  }

  return Handlebars.compile(headContent)(options.context);
}
