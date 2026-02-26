import path from 'node:path';
import fs from 'node:fs/promises';

import Handlebars from 'handlebars';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
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
  data: IndexData,
): Promise<string>;

export function renderTemplate(
  templateName: 'show',
  data: ShowData,
): Promise<string>;

export function renderTemplate(
  templateName: 'error',
  data: ErrorData,
): Promise<string>;

export async function renderTemplate(
  templateName: 'index' | 'show' | 'error',
  data: IndexData | ShowData | ErrorData,
): Promise<string> {
  const templatePath = path.join(templatesPath, `${templateName}.hbs`);

  const template = Handlebars.compile(
    await fs.readFile(templatePath).then((buffer) => buffer.toString()),
  );

  return template(data);
}
