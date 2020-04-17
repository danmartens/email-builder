import { Node } from './types';

const unsubscribeElement = (tree) => {
  tree.match({ tag: 'unsubscribe' }, (node: Node) => {
    return { ...node, tag: 'a', attrs: { ...node.attrs, href: '#' } };
  });
};

export default unsubscribeElement;
