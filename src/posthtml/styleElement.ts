import 'core-js/es/array/flat-map';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import { Node } from './types';

const stripInlinableStyles = postcss.plugin('postcss-test', (options) => {
  return (root, result) => {
    root.walkRules((rule) => {
      if (rule.parent.type !== 'atrule') {
        rule.remove();
      }
    });
  };
});

const styleElement = (options: { publish: boolean }) => (tree, callback) => {
  const elements: Node[] = [];
  let tasks = 0;

  const done = () => {
    tasks--;

    if (tasks === 0) callback(null, tree);
  };

  tree.match(
    { tag: 'style' },
    (node: Node): Node => {
      if (node.attrs != null && 'data-ignore' in node.attrs) {
        return node;
      }

      elements.push(node);

      return {
        tag: undefined
      };
    }
  );

  tree.match(
    { tag: 'head' },
    (node): Node => {
      tasks++;

      const styleNode = {
        tag: 'style',
        content: []
      };

      const styles: string = elements
        .flatMap(({ content }) => content)
        .join('\n');

      postcss(
        [
          stripInlinableStyles,
          options.publish ? autoprefixer : undefined
        ].filter(Boolean)
      )
        .process(styles, { from: undefined })
        .then((result) => {
          styleNode.content.push(result.css);

          done();
        });

      return {
        ...node,
        content: [...(node.content ?? []), styleNode]
      };
    }
  );

  if (tasks === 0) callback(null, tree);
};

export default styleElement;
