import fs from 'fs';
import path from 'path';
import posthtml, { PostHTML } from 'posthtml';

import inlineCSS from 'posthtml-inline-css';
import prettier from 'prettier';
import Handlebars from 'handlebars';
import marked from 'marked';
import { parseBoxValues } from './parseBoxValues';
import { Node } from './types';

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
              content: [
                {
                  tag: 'td',
                  attrs: buildAttrs({
                    colspan,
                    height: padding.top
                  })
                }
              ]
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
              content: [
                {
                  ...this.node,
                  attrs: {
                    ...(this.node.attrs || {}),
                    align: undefined,
                    padding: undefined,
                    'max-width': undefined
                  }
                }
              ]
            },
            padding.right > 0
              ? { tag: 'td', attrs: buildAttrs({ width: padding.right }) }
              : undefined
          ].filter((item) => item != null)
        },
        padding.bottom > 0
          ? {
              tag: 'tr',
              content: [
                {
                  tag: 'td',
                  attrs: buildAttrs({
                    colspan,
                    height: padding.bottom
                  })
                }
              ]
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
  tree.match({ tag: 'img' }, (node: Node) => {
    if (!node.attrs?.src?.startsWith('/')) {
      return node;
    }

    const src = `/assets/${emailName}/${node.attrs.src.replace(/^\//, '')}`;
    const width = node.attrs.width || node.attrs['max-width'];

    return mergeStyle(
      {
        width: '100%',
        'max-width': `${width}px`
      },
      {
        ...node,
        attrs: {
          ...node.attrs,
          src,
          width
        }
      }
    );
  });
};

import parse from 'posthtml-parser';

const syntaxAttribute = (tree) => {
  tree.match({ attrs: { syntax: /[a-z]+/ } }, (node) => {
    if (node.attrs.syntax === 'markdown') {
      return {
        ...node,
        attrs: buildAttrs({
          ...node.attrs,
          syntax: undefined
        }),
        content: parse(
          marked(
            node.content[0]
              .split('\n')
              .map((line) => line.replace(/^\s+/, ''))
              .join('\n')
          )
        )
      };
    }

    throw new Error(`Unkown syntax: ${node.attrs.syntax}`);
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
    syntaxAttribute,
    inlineCSS(),
    imageElement(template.name),
    section,
    tableElement
  ]).process(
    emailTemplate({ isDevelopment: true, content: handlebarsTemplate(data) })
  );

  return prettier.format(result.html, { parser: 'html' });
};
