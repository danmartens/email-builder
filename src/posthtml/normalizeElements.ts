import mergeStyle from './utils/mergeStyle';
import { PostHTMLPlugin } from './types';
import pipe from './utils/pipe';
import defaultAttrs from './utils/defaultAttrs';

const normalizeElements: PostHTMLPlugin = (tree) => {
  tree.match({ tag: 'table' }, (node) => {
    return pipe(
      defaultAttrs({
        border: '0',
        cellspacing: '0',
        cellpadding: '0'
      }),
      mergeStyle({ 'border-collapse': 'collapse' })
    )(node);
  });
};

export default normalizeElements;
