import parseAttrs from 'posthtml-attrs-parser';
import { PostHTMLNode } from '../types';

export const mergeStyle =
  (style: object) =>
  (node: PostHTMLNode): PostHTMLNode => {
    const attrs = parseAttrs(node.attrs ?? {});

    attrs.style = { ...style, ...(attrs.style ?? {}) };

    return {
      ...node,
      attrs: attrs.compose(),
    };
  };
