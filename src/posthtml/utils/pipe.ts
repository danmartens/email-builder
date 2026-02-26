import { PostHTMLNode } from '../types';

export const pipe =
  (
    ...transforms: Array<(node: PostHTMLNode) => PostHTMLNode>
  ): ((node: PostHTMLNode) => PostHTMLNode) =>
  (node) =>
    transforms.reduce(
      (transformedNode, transform) => transform(transformedNode),
      node,
    );
