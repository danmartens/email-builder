import { Node } from './types';

const styleElement = (tree) => {
  const elements: Node[] = [];

  tree.match({ tag: 'style' }, (node) => {
    elements.push(node);
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
