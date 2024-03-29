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
    return this.node.attrs?.['data-align'];
  }

  private get padding() {
    return parseResponsiveValue(
      this.getAttribute('data-padding'),
      parseBoxValues
    );
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
    return this.getAttribute('data-max-width');
  }

  private get background() {
    return this.getAttribute('data-background');
  }

  private getAttribute(name: string) {
    if (this.node.attrs != null) {
      return this.node.attrs[name];
    }
  }

  toNode(): PostHTMLNode[] {
    const { align, colspan } = this;

    const padding = this.padding.defaultValue ?? {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0
    };

    return [
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
                      'data-align': undefined,
                      'data-padding': undefined,
                      'data-max-width': undefined,
                      'data-background': undefined
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
    ];
  }
}

const section: PostHTMLPlugin = (tree) => {
  tree.match({ attrs: { 'data-padding': /\d+( \d+){0,3}/ } }, (node) => {
    return new Section(node).toNode();
  });

  tree.match({ attrs: { 'data-max-width': /\d+/ } }, (node) => {
    return new Section(node).toNode();
  });

  tree.match({ attrs: { 'data-align': /[a-z]+/ } }, (node) => {
    if (node.tag === 'td') {
      return node;
    }

    return new Section(node).toNode();
  });

  tree.match({ attrs: { 'data-background': /#[0-9a-f]{3,6}/ } }, (node) => {
    return new Section(node).toNode();
  });
};

export default section;
