import 'core-js/es/array/flat-map';
import compact from 'lodash/compact';
import postcss from 'postcss';
import postcssCustomProperties from 'postcss-custom-properties';
import { PostHTMLPlugin } from './types';

const preprocessStyles = (options: {
  stripPadding: boolean;
  stripCustomFonts: boolean;
  stripMediaQueries: boolean;
}): PostHTMLPlugin => (tree, callback) => {
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

    postcss(
      compact([
        postcssCustomProperties({ preserve: false }),
        options.stripPadding ? stripPadding : undefined,
        options.stripCustomFonts ? stripCustomFonts : undefined
      ])
    )
      .process(node.content.join('\n'), { from: undefined })
      .then((result) => {
        node.content = [result.css];

        done();
      });

    return node;
  });

  if (tasks === 0) callback(null, tree);
};

const stripPadding = postcss.plugin('strip-padding', () => {
  return (root) => {
    root.walkDecls('padding', (decl) => {
      decl.remove();
    });
  };
});

const stripCustomFonts = postcss.plugin('strip-custom-fonts', () => {
  return (root) => {
    root.walkDecls('font-family', (decl) => {
      decl.value = decl.value
        .split(/\s*,\s*/)
        .filter((family) =>
          [
            'Times New Roman',
            'Arial',
            'Verdana',
            'serif',
            'sans-serif'
          ].includes(family)
        )
        .join(', ');
    });
  };
});

export default preprocessStyles;
