import mergeStyle from './utils/mergeStyle';
import { PostHTMLPlugin } from './types';

const tableElement: PostHTMLPlugin = (tree) => {
  tree.match({ tag: 'table' }, (node) => {
    return mergeStyle({ 'border-collapse': 'collapse' })({
      ...node,
      attrs: {
        border: '0',
        cellspacing: '0',
        cellpadding: '0',
        ...(node.attrs || {})
      }
    });
  });
};

export default tableElement;
