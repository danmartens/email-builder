import { Node } from '../types';

const pipe = (
  ...transforms: Array<(node: Node) => Node>
): ((node: Node) => Node) => (node) =>
  transforms.reduce(
    (transformedNode, transform) => transform(transformedNode),
    node
  );

export default pipe;
