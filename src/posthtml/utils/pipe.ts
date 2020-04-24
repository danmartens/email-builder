import { PostHTMLNode } from '../types';

const pipe = (
  ...transforms: Array<(node: PostHTMLNode) => PostHTMLNode>
): ((node: PostHTMLNode) => PostHTMLNode) => (node) =>
  transforms.reduce(
    (transformedNode, transform) => transform(transformedNode),
    node
  );

export default pipe;
