import parseAttrs from 'posthtml-attrs-parser';
import { PostHTMLNode } from '../types';

const addClass = (className: string) => (node: PostHTMLNode): PostHTMLNode => {
  const attrs = parseAttrs(node.attrs || {});

  if (attrs.class == null) {
    attrs.class = [];
  }

  attrs.class.push(className);

  return {
    ...node,
    attrs: attrs.compose()
  };
};

export default addClass;
