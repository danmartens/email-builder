import path from 'path';
import fs from 'fs';
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

function renderTemplate(
  templateName: 'index',
  data: IndexData
): Promise<string>;

function renderTemplate(templateName: 'show', data: ShowData): Promise<string>;

function renderTemplate(
  templateName: 'error',
  data: ErrorData
): Promise<string>;

function renderTemplate(
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

export default renderTemplate;
