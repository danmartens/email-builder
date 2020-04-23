import 'core-js/es/array/flat-map';
import { Node } from './types';

const styleElement = (tree) => {
  const elements: Node[] = [];

  tree.match({ tag: 'style' }, (node: Node) => {
    if (node.attrs != null && 'data-ignore' in node.attrs) {
      return node;
    }

    elements.push(node);

    return {
      tag: undefined
    };
  });

  tree.match({ tag: 'head' }, (node) => {
    return {
      ...node,
      content: [
        ...(node.content ?? []),
        {
          tag: 'style',
          content: elements.flatMap(({ content }) => content)
        }
      ]
    };
  });
};

export default styleElement;
