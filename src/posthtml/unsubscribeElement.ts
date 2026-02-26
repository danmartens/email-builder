import { PostHTMLPlugin } from './types';

export const unsubscribeElement: PostHTMLPlugin = (tree) => {
  tree.match({ tag: 'unsubscribe' }, (node) => {
    return { ...node, tag: 'a', attrs: { ...node.attrs, href: '#' } };
  });
};
