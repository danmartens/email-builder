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

  return { top: 0, left: 0, bottom: 0, right: 0 };
};

interface Node {
  tag: string;
  attrs?: {
    [key: string]: string;
  };
  content?: Node | Node[];
}

const buildAttrs = (attrs: { [key: string]: string | number | undefined }) => {
  return Object.fromEntries(
    Object.entries(attrs)
      .filter(([key, value]) => value != null)
      .map(([key, value]) => [key, value.toString()])
  );
};

class Section {
  private readonly node: Node;

  constructor(node: Node) {
    this.node = node;
  }

  private get align() {
    return this.node.attrs?.align;
  }

  private get padding() {
    return parseBoxValues(this.node.attrs?.padding);
  }

  private get colspan() {
    const { left, right } = this.padding;

    if (left > 0 && right > 0) {
      return 3;
    }

    if (left > 0 || right > 0) {
      return 2;
    }
  }

  private get maxWidth() {
    return (this.node.attrs ?? {})['max-width'] ?? undefined;
  }

  toNode(): Node {
    const { align, padding, colspan } = this;

    return {
      tag: 'table',
      attrs: buildAttrs({
        width: this.maxWidth,
        style:
          this.maxWidth != null ? `max-width: ${this.maxWidth}px` : undefined
      }),
      content: [
        padding.top > 0
          ? {
              tag: 'tr',
              content: {
                tag: 'td',
                attrs: buildAttrs({
                  colspan,
                  height: padding.top
                })
              }
            }
          : undefined,
        {
          tag: 'tr',
          content: [
            padding.left > 0
              ? { tag: 'td', attrs: buildAttrs({ width: padding.left }) }
              : undefined,
            {
              tag: 'td',
              attrs: buildAttrs({ align }),
              content: {
                ...this.node,
                attrs: {
                  ...(this.node.attrs || {}),
                  align: undefined,
                  padding: undefined,
                  'max-width': undefined
                }
              }
            },
            padding.right > 0
              ? { tag: 'td', attrs: buildAttrs({ width: padding.right }) }
              : undefined
          ].filter((item) => item != null)
        },
        padding.bottom > 0
          ? {
              tag: 'tr',
              content: {
                tag: 'td',
                attrs: buildAttrs({
                  colspan,
                  height: padding.bottom
                })
              }
            }
          : undefined
      ]
    };
  }
}

const section = (tree) => {
  tree.match({ attrs: { padding: /\d+( \d+){0,3}/ } }, (node) => {
    return new Section(node).toNode();
  });

  tree.match({ attrs: { 'max-width': /\d+/ } }, (node) => {
    return new Section(node).toNode();
  });

  tree.match({ attrs: { align: /[a-z]+/ } }, (node) => {
    if (node.tag === 'td') {
      return node;
    }

    return new Section(node).toNode();
  });
};

import { mergeStyle } from './mergeStyle';

const tableElement = (tree) => {
  tree.match({ tag: 'table' }, (node) => {
    return mergeStyle(
      { 'border-collapse': 'collapse', width: '100%' },
      {
        ...node,
        attrs: {
          border: '0',
          cellspacing: '0',
          cellpadding: '0',
          ...(node.attrs || {})
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
    section,
    tableElement
  ]).process(
    emailTemplate({ isDevelopment: true, content: handlebarsTemplate(data) })
  );

  return prettier.format(result.html, { parser: 'html' });
};
