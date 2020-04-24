import { PostHTMLPlugin } from './types';

const unsubscribeElement: PostHTMLPlugin = (tree) => {
  tree.match({ tag: 'unsubscribe' }, (node) => {
    return { ...node, tag: 'a', attrs: { ...node.attrs, href: '#' } };
  });
};

export default unsubscribeElement;
