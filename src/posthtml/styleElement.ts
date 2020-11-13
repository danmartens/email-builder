import 'core-js/es/array/flat-map';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import { PostHTMLNode, PostHTMLPlugin } from './types';
import compact from 'lodash/compact';

const stripInlinableStyles = postcss.plugin('postcss-test', () => {
  return (root) => {
    root.walkRules((rule) => {
      if (rule.parent.type !== 'atrule') {
        rule.remove();
      }
    });
  };
});

const styleElement = (options: { publish: boolean }): PostHTMLPlugin => (
  tree,
  callback
) => {
  const elements: PostHTMLNode[] = [];

  let tasks = 0;

  const done = () => {
    tasks--;

    if (tasks === 0) callback(null, tree);
  };

  tree.match({ tag: 'style' }, (node) => {
    if (node.attrs != null && 'data-ignore' in node.attrs) {
      return node;
    }

    elements.push(node);
  });

  tree.match({ tag: 'head' }, (node) => {
    tasks++;

    const styleNode: PostHTMLNode = {
      tag: 'style',
      content: []
    };

    const styles: string = elements
      .flatMap(({ content }) => content)
      .join('\n');

    postcss(
      compact([
        stripInlinableStyles,
        options.publish ? autoprefixer : undefined
      ])
    )
      .process(styles, { from: undefined })
      .then((result) => {
        styleNode.content!.push(result.css);

        done();
      });

    return {
      ...node,
      content: [...(node.content ?? []), styleNode]
    };
  });

  if (tasks === 0) callback(null, tree);
};

export default styleElement;
