import 'core-js/es/array/flat-map';
import postcss from 'postcss';
import cssnano from 'cssnano';
import { PostHTMLPlugin } from './types';

const minifyStyles: PostHTMLPlugin = (tree, callback) => {
  let tasks = 0;

  const done = () => {
    tasks--;

    if (tasks === 0) callback(null, tree);
  };

  tree.match({ tag: 'style' }, (node) => {
    if (node.content == null) {
      return node;
    }

    tasks++;

    postcss([cssnano({ preset: 'default' })])
      .process(node.content.join('\n'), { from: undefined })
      .then((result) => {
        node.content = [result.css];

        done();
      });

    return node;
  });

  if (tasks === 0) callback(null, tree);
};

export default minifyStyles;
