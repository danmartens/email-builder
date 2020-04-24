import { PostHTMLPlugin } from './types';

const removeExtraElements: PostHTMLPlugin = (tree) => {
  tree.match({ tag: 'td' }, (node) => {
    if (
      node.content?.length === 1 &&
      typeof node.content[0] !== 'string' &&
      node.content[0].tag === 'div' &&
      node.content[0].attrs != null &&
      Object.keys(node.content[0].attrs).length === 0
    ) {
      return { ...node, content: node.content[0].content };
    }

    return node;
  });
};

export default removeExtraElements;
