import { compact, flattenDeep } from 'lodash-es';

import { pipe } from './utils/pipe';
import { mergeStyle } from './utils/mergeStyle';
import { defaultAttrs } from './utils/defaultAttrs';
import { PostHTMLPlugin } from './types';

export const normalizeElements: PostHTMLPlugin = (tree) => {
  tree.match({ tag: 'table' }, (node) => {
    return pipe(
      defaultAttrs({
        border: '0',
        cellspacing: '0',
        cellpadding: '0',
      }),
      mergeStyle({ 'border-collapse': 'collapse' }),
    )(node);
  });

  // Flatten nested content arrays and remove nullish elements
  tree.match({ tag: /.+/ }, (node) => {
    if (!Array.isArray(node.content)) {
      return node;
    }

    return { ...node, content: compact(flattenDeep(node.content)) };
  });
};
