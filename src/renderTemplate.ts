import path from 'node:path';
import fs from 'node:fs';

import Handlebars from 'handlebars';

const templatesPath = path.resolve(__dirname, './templates');

interface IndexData {
  emails: { name: string }[];
}

interface ShowData {
  name: string;
  schema: string;
  scriptUrl: string;
}

interface ErrorData {
  message: string;
}

export function renderTemplate(
  templateName: 'index',
  data: IndexData
): Promise<string>;

export function renderTemplate(templateName: 'show', data: ShowData): Promise<string>;

export function renderTemplate(
  templateName: 'error',
  data: ErrorData
): Promise<string>;

export function renderTemplate(
  templateName: 'index' | 'show' | 'error',
  data: IndexData | ShowData | ErrorData
): Promise<string> {
  return new Promise((resolve) => {
    const template = Handlebars.compile(
      fs
        .readFileSync(path.join(templatesPath, `${templateName}.hbs`))
        .toString()
    );

    resolve(template(data));
  });
}

