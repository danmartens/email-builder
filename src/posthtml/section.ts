import parseBoxValues from './utils/parseBoxValues';
import buildAttrs from './utils/buildAttrs';
import { Node } from './types';

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
              attrs: {},
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
          attrs: {},
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
                  attrs: buildAttrs({
                    ...(this.node.attrs || {}),
                    align: undefined,
                    padding: undefined,
                    'max-width': undefined
                  })
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
              attrs: {},
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

export default section;
