declare module 'posthtml-attrs-parser' {
  function parseAttrs(attrs: {
    [name: string]: string | undefined;
  }): {
    class?: string[];
    style?: { [name: string]: string | undefined };
    compose(): { [name: string]: string | undefined };
  };

  export default parseAttrs;
}
