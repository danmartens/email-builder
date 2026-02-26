import { PostHTMLPlugin } from './types';

export const removeClassAttributes: PostHTMLPlugin = (tree) => {
  tree.match({ attrs: { class: /.*/ } }, (node) => {
    return { ...node, attrs: { ...node.attrs, class: undefined } };
  });
};
