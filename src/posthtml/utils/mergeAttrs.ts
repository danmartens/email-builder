import { Node } from '../types';

const mergeAttrs = (attrs: object) => (node: Node): Node => {
  return {
    ...node,
    attrs: {
      ...(node.attrs ?? {}),
      ...attrs
    }
  };
};

export default mergeAttrs;
