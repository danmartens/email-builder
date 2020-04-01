export interface Template {
  name: string;
  rootPath?: string;
}

export interface Node {
  tag: string;
  attrs?: {
    [key: string]: string;
  };
  content?: Array<Node | string>;
}
