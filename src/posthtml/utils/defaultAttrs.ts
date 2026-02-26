import { PostHTMLNode } from '../types';
import { buildAttrs } from './buildAttrs';

export const defaultAttrs =
  (attrs: object) =>
  (node: PostHTMLNode): PostHTMLNode => {
    return {
      ...node,
      attrs: buildAttrs({
        ...attrs,
        ...(node.attrs ?? {}),
      }),
    };
  };
