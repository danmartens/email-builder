import fs from 'fs';
import path from 'path';
import posthtml, { PostHTML } from 'posthtml';

import inlineCSS from 'posthtml-inline-css';
import prettier from 'prettier';
import Handlebars from 'handlebars';

interface BoxValues {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

const parseBoxValues = (values: string): BoxValues => {
  if (typeof values === 'string') {
    const parsedValues = values.split(/\s+/).map((value) => parseInt(value));

    switch (parsedValues.length) {
      case 4:
        return {
          top: parsedValues[0],
          left: parsedValues[1],
          bottom: parsedValues[2],
          right: parsedValues[3]
        };

      case 2:
        return {
          top: parsedValues[0],
          left: parsedValues[1],
          bottom: parsedValues[0],
          right: parsedValues[1]
        };

      case 1:
        return {
          top: parsedValues[0],
          left: parsedValues[0],
          bottom: parsedValues[0],
          right: parsedValues[0]
        };

      default:
        throw new Error(`Invalid padding value: "${values}"`);
    }
  }
};

const paddingElement = (tree) => {
  tree.match({ tag: 'padding' }, (node) => {
    return {
      tag: 'table',
      content: [
        {
          tag: 'tr',
          content: [
            { tag: 'td', attrs: { colspan: '3', height: node.attrs?.top } }
          ]
        },
        {
          tag: 'tr',
          content: [
            { tag: 'td', attrs: { width: node.attrs?.left } },
            { tag: 'td', content: node.content },
            { tag: 'td', attrs: { width: node.attrs?.right } }
          ]
        },
        {
          tag: 'tr',
          content: [
            { tag: 'td', attrs: { colspan: '3', height: node.attrs?.bottom } }
          ]
        }
      ]
    };
  });
};

const paddingAttribute = (tree) => {
  tree.match({ attrs: { padding: /\d+( \d+){0,3}/ } }, (node) => {
    const { top, left, bottom, right } = parseBoxValues(node.attrs.padding);

    return {
      tag: 'padding',
      attrs: { top, left, bottom, right },
      content: { ...node, attrs: { ...node.attrs, padding: undefined } }
    };
  });
};

import { mergeStyle } from './mergeStyle';

const tableElement = (tree) => {
  tree.match({ tag: 'table' }, (node) => {
    return mergeStyle(
      { 'border-collapse': 'collapse' },
      {
        ...node,
        attrs: {
          border: '0',
          cellspacing: '0',
          cellpadding: '0'
        }
      }
    );
  });
};

const imageElement = (emailName: string) => (tree) => {
  tree.match({ tag: 'img' }, (node) => {
    if (!node.attrs.src.startsWith('/')) {
      return node;
    }

    const src = `/assets/${emailName}/${node.attrs.src.replace(/^\//, '')}`;
    const width = node.attrs.width || node.attrs['max-width'];

    return {
      ...node,
      attrs: {
        ...node.attrs,
        src,
        width
      }
    };
  });
};

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
    inlineCSS(),
    imageElement(template.name),
    paddingAttribute,
    paddingElement,
    tableElement
  ]).process(
    emailTemplate({ isDevelopment: true, content: handlebarsTemplate(data) })
  );

  return prettier.format(result.html, { parser: 'html' });
};
