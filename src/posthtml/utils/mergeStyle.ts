import parseAttrs from 'posthtml-attrs-parser';
import { Node } from '../types';

const mergeStyle = (style: object, node: Node): Node => {
  const attrs = parseAttrs(node.attrs);

  attrs.style = { ...style, ...(attrs.style || {}) };

  return {
    ...node,
    attrs: attrs.compose()
  };
};

export default mergeStyle;
