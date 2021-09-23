import { PostHTMLPlugin } from './types';
import mergeAttrs from './utils/mergeAttrs';

const moveDataClassAttributes: PostHTMLPlugin = (tree) => {
  tree.match({ attrs: { 'data-class': /.+/ } }, (node) => {
    if (node.attrs == null) {
      return node;
    }

    return mergeAttrs({
      class: node.attrs['data-class'],
      'data-class': undefined
    })(node);
  });
};

export default moveDataClassAttributes;
