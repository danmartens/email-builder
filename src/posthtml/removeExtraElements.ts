import { Node } from './types';

const removeExtraElements = (tree) => {
  tree.match({ tag: 'td' }, (node: Node) => {
    if (
      node.content?.length === 1 &&
      typeof node.content[0] !== 'string' &&
      node.content[0].tag === 'div' &&
      Object.keys(node.content[0].attrs).length === 0
    ) {
      return { ...node, content: node.content[0].content };
    }

    return node;
  });
};

export default removeExtraElements;
