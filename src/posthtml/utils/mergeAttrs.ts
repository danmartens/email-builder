import { Node } from '../types';
import buildAttrs from './buildAttrs';

const mergeAttrs = (attrs: object) => (node: Node): Node => {
  return {
    ...node,
    attrs: buildAttrs({
      ...(node.attrs ?? {}),
      ...attrs
    })
  };
};

export default mergeAttrs;
