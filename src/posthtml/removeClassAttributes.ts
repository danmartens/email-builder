import { PostHTMLPlugin } from './types';

const removeClassAttributes: PostHTMLPlugin = (tree) => {
  tree.match({ attrs: { class: /.*/ } }, (node) => {
    return { ...node, attrs: { ...node.attrs, class: undefined } };
  });
};

export default removeClassAttributes;
