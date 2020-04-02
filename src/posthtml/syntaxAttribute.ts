import marked from 'marked';
import parse from 'posthtml-parser';
import buildAttrs from './utils/buildAttrs';
import { Node } from './types';

const syntaxAttribute = (tree) => {
  tree.match(
    { attrs: { syntax: /[a-z]+/ } },
    (node: Node): Node => {
      const content = node.content[0];

      if (typeof content !== 'string') {
        throw new Error('Invalid markdown content');
      }

      if (node.attrs.syntax === 'markdown') {
        return {
          ...node,
          attrs: buildAttrs({
            ...node.attrs,
            syntax: undefined
          }),
          content: parse(
            marked(
              content
                .split('\n')
                .map((line) => line.replace(/^\s+/, ''))
                .join('\n')
            )
          ) as Node[]
        };
      }

      throw new Error(`Unkown syntax: ${node.attrs.syntax}`);
    }
  );
};

export default syntaxAttribute;
