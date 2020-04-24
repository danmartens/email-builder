import 'core-js/es/array/flat-map';
import postcss from 'postcss';
import postcssCustomProperties from 'postcss-custom-properties';
import { PostHTMLPlugin } from './types';

const preprocessStyles: PostHTMLPlugin = (tree, callback) => {
  let tasks = 0;

  const done = () => {
    tasks--;

    if (tasks === 0) callback(null, tree);
  };

  tree.match({ tag: 'style' }, (node) => {
    if (node.attrs != null && 'data-ignore' in node.attrs) {
      return node;
    }

    if (node.content == null) {
      return node;
    }

    tasks++;

    postcss([postcssCustomProperties({ preserve: false })])
      .process(node.content.join('\n'), { from: undefined })
      .then((result) => {
        node.content = [result.css];

        done();
      });

    return node;
  });

  if (tasks === 0) callback(null, tree);
};

export default preprocessStyles;
