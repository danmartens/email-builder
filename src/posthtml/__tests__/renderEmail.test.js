import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import prettier from 'prettier';

import { renderEmail } from '../renderEmail';

jest.mock('prettier', () => ({
  format: jest.fn((html) => Promise.resolve(html)),
}));

let tmpDir;

beforeEach(() => {
  jest.clearAllMocks();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'email-builder-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

test('renders content inside the standard email HTML structure', async () => {
  const html = await renderEmail({ name: 'test' }, '<p>Hello</p>');

  expect(html).toMatchSnapshot();
});

test('applies context variables to the content template', async () => {
  const html = await renderEmail({ name: 'test' }, '<p>Hello, {{name}}!</p>', {
    context: { name: 'World' },
  });

  expect(html).toContain('Hello, World!');
});

test('preview-text helper renders hidden text with whitespace padding', async () => {
  const html = await renderEmail(
    { name: 'test' },
    '{{preview-text "Preview text here"}}',
  );

  expect(html).toContain('Preview text here');
  expect(html).toContain('display: none');
  expect(html).toContain('max-height: 0px');
});

test('injects head.hbs content into the email head', async () => {
  fs.writeFileSync(
    path.join(tmpDir, 'head.hbs'),
    '<meta name="color-scheme" content="light" />',
  );

  const html = await renderEmail(
    { name: 'test', rootPath: tmpDir },
    '<p>Hello</p>',
  );

  expect(html).toContain('color-scheme');
  expect(html).toContain('light');
});

test('evaluates Handlebars expressions in head.hbs using the provided context', async () => {
  fs.writeFileSync(
    path.join(tmpDir, 'head.hbs'),
    '<meta name="description" content="{{description}}" />',
  );

  const html = await renderEmail(
    { name: 'test', rootPath: tmpDir },
    '<p>Hello</p>',
    { context: { description: 'My Email Description' } },
  );

  expect(html).toContain('My Email Description');
});

test('registers and renders Handlebars partials from the partials directory', async () => {
  const partialsDir = path.join(tmpDir, 'partials');
  fs.mkdirSync(partialsDir);
  fs.writeFileSync(
    path.join(partialsDir, 'footer.hbs'),
    '<p>Footer content</p>',
  );

  const html = await renderEmail(
    { name: 'test', rootPath: tmpDir },
    '{{> footer}}',
  );

  expect(html).toContain('Footer content');
});

test('formats output with Prettier in development mode', async () => {
  await renderEmail({ name: 'test' }, '<p>Hello</p>');

  expect(prettier.format).toHaveBeenCalled();
});

test('does not format output with Prettier in publish mode', async () => {
  await renderEmail({ name: 'test' }, '<p>Hello</p>', { publish: true });

  expect(prettier.format).not.toHaveBeenCalled();
});
