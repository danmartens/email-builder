import 'core-js/es/array/flat-map';
import postcss from 'postcss';
import { PostHTMLPlugin } from './types';

const stripMediaQueries = postcss.plugin('strip-media-queries', () => {
  return (root) => {
    root.walkAtRules((rule) => {
      if (rule.name === 'media') {
        rule.remove();
      }
    });
  };
});

const development = (options: {
  stripMediaQueries: boolean;
}): PostHTMLPlugin => (tree, callback) => {
  if (!options.stripMediaQueries) {
    callback(null, tree);
    return;
  }

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

    postcss([stripMediaQueries])
      .process(node.content.join('\n'), { from: undefined })
      .then((result) => {
        node.content = [result.css];

        done();
      });

    return node;
  });

  if (tasks === 0) callback(null, tree);
};

export default development;
