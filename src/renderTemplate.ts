import path from 'path';
import fs from 'fs';
import Handlebars from 'handlebars';

const templatesPath = path.resolve(__dirname, './templates');

function renderTemplate(
  templateName: 'index',
  data: { emails: { name: string }[] }
);

function renderTemplate(
  templateName: 'show',
  data: { name: string; schema: string; scriptUrl: string }
);

function renderTemplate(templateName: 'error', data: { message: string });

function renderTemplate(templateName, data): Promise<string> {
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
