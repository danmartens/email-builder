import marked from 'marked';
import parse from 'posthtml-parser';
import buildAttrs from './utils/buildAttrs';
import { PostHTMLNode, PostHTMLPlugin } from './types';

const syntaxAttribute: PostHTMLPlugin = (tree) => {
  tree.match({ attrs: { syntax: /[a-z]+/ } }, (node) => {
    if (node.content == null) {
      return node;
    }

    const content = node.content[0];

    if (typeof content !== 'string') {
      throw new Error('Invalid markdown content');
    }

    if (node.attrs?.syntax === 'markdown') {
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
        ) as PostHTMLNode[]
      };
    }

    throw new Error(`Unknown syntax: ${node.attrs?.syntax}`);
  });
};

export default syntaxAttribute;
