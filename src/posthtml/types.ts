export interface Template {
  name: string;
  rootPath?: string;
}

export interface PostHTMLNode {
  tag: string | undefined;
  attrs?: {
    [key: string]: string | undefined;
  };
  content?: Array<string | PostHTMLNode>;
}

interface PostHTMLTree {
  match(
    condition: {
      tag?: string | RegExp;
      attrs?: { [name: string]: string | RegExp };
    },
    predicate: (
      node: PostHTMLNode
    ) => PostHTMLNode | Array<string | PostHTMLNode> | undefined
  ): void;
}

export type PostHTMLPlugin = (
  tree: PostHTMLTree,
  callback: (arg1: null, tree: PostHTMLTree) => void
) => void;
