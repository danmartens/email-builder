import parseBoxValues from './utils/parseBoxValues';
import buildAttrs from './utils/buildAttrs';
import parseResponsiveValue from './utils/parseResponsiveValue';
import { PostHTMLNode, PostHTMLPlugin } from './types';
import uniqueId from 'lodash/uniqueId';
import compact from 'lodash/compact';

class Section {
  private readonly id: string;
  private readonly node: PostHTMLNode;

  constructor(node: PostHTMLNode) {
    this.id = uniqueId('s');
    this.node = node;
  }

  private get align() {
    return this.node.attrs?.align;
  }

  private get padding() {
    return parseResponsiveValue(this.node.attrs?.padding, parseBoxValues);
  }

  private get colspan() {
    const { padding } = this;

    if (padding.defaultValue == null) {
      return;
    }

    const { left, right } = padding.defaultValue;

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

  private get background() {
    return this.node?.attrs?.background;
  }

  toNode(): PostHTMLNode {
    const { align, colspan } = this;

    const padding = this.padding.defaultValue ?? {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0
    };

    return {
      tag: undefined,
      content: [
        {
          tag: 'style',
          attrs: {},
          content: this.padding.buildMediaQueries((value) =>
            [
              `#${this.id}-pt { height: ${value.top}px; }`,
              `#${this.id}-pl { width: ${value.left}px; }`,
              `#${this.id}-pb { height: ${value.bottom}px; }`,
              `#${this.id}-pr { width: ${value.right}px; }`
            ].join(' ')
          )
        },
        {
          tag: 'table',
          attrs: buildAttrs({
            id: this.id,
            width: this.maxWidth,
            bgcolor: this.background,
            style:
              this.maxWidth != null
                ? `max-width: ${this.maxWidth}px`
                : 'width: 100%'
          }),
          content: compact([
            padding.top > 0
              ? {
                  tag: 'tr',
                  attrs: {},
                  content: [
                    {
                      tag: 'td',
                      attrs: buildAttrs({
                        id: `${this.id}-pt`,
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
              content: compact([
                padding.left > 0
                  ? {
                      tag: 'td',
                      attrs: buildAttrs({
                        id: `${this.id}-pl`,
                        width: padding.left
                      })
                    }
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
                        'max-width': undefined,
                        background: undefined
                      })
                    }
                  ]
                },
                padding.right > 0
                  ? {
                      tag: 'td',
                      attrs: buildAttrs({
                        id: `${this.id}-pr`,
                        width: padding.right
                      })
                    }
                  : undefined
              ])
            },
            padding.bottom > 0
              ? {
                  tag: 'tr',
                  attrs: {},
                  content: [
                    {
                      tag: 'td',
                      attrs: buildAttrs({
                        id: `${this.id}-pb`,
                        colspan,
                        height: padding.bottom
                      })
                    }
                  ]
                }
              : undefined
          ])
        }
      ]
    };
  }
}

const section: PostHTMLPlugin = (tree) => {
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

  tree.match({ attrs: { background: /#[0-9a-f]{3,6}/ } }, (node) => {
    return new Section(node).toNode();
  });
};

export default section;
