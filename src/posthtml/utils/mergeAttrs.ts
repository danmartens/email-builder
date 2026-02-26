import { PostHTMLNode } from '../types';
import { buildAttrs } from './buildAttrs';

export const mergeAttrs =(attrs: object) => (node: PostHTMLNode): PostHTMLNode => {
  return {
    ...node,
    attrs: buildAttrs({
      ...(node.attrs ?? {}),
      ...attrs
    })
  };
};

