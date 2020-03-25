import parseAttrs from 'posthtml-attrs-parser';

export const mergeStyle = (
  style: object,
  node: { attrs?: { style?: { [key: string]: string } } }
) => {
  const attrs = parseAttrs(node.attrs);

  attrs.style = { ...style, ...(attrs.style || {}) };

  return {
    ...node,
    attrs: attrs.compose()
  };
};
