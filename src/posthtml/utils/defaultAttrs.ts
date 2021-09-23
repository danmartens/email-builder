import { PostHTMLNode } from '../types';
import buildAttrs from './buildAttrs';

const defaultAttrs = (attrs: object) => (node: PostHTMLNode): PostHTMLNode => {
  return {
    ...node,
    attrs: buildAttrs({
      ...attrs,
      ...(node.attrs ?? {})
    })
  };
};

export default defaultAttrs;
