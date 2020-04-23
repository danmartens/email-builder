export interface Template {
  name: string;
  rootPath?: string;
}

export interface Node {
  tag: string | undefined;
  attrs?: {
    [key: string]: string | undefined;
  };
  content?: Array<string | Node>;
}
