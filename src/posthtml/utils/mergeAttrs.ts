import { PostHTMLNode } from '../types';
import buildAttrs from './buildAttrs';

const mergeAttrs = (attrs: object) => (node: PostHTMLNode): PostHTMLNode => {
  return {
    ...node,
    attrs: buildAttrs({
      ...(node.attrs ?? {}),
      ...attrs
    })
  };
};

export default mergeAttrs;
