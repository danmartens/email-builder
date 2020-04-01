import parseAttrs from 'posthtml-attrs-parser';
import { Node } from './types';

export const mergeStyle = (style: object, node: Node) => {
  const attrs = parseAttrs(node.attrs);

  attrs.style = { ...style, ...(attrs.style || {}) };

  return {
    ...node,
    attrs: attrs.compose()
  };
};
