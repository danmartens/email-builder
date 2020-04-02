import mergeStyle from './utils/mergeStyle';

const tableElement = (tree) => {
  tree.match({ tag: 'table' }, (node) => {
    return mergeStyle(
      { 'border-collapse': 'collapse', width: '100%' },
      {
        ...node,
        attrs: {
          border: '0',
          cellspacing: '0',
          cellpadding: '0',
          ...(node.attrs || {})
        }
      }
    );
  });
};

export default tableElement;
