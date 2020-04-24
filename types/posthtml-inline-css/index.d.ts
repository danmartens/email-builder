declare module 'posthtml-inline-css' {
  import { PostHTML } from 'posthtml';

  const plugin: () => PostHTML.Plugin<unknown>;

  export default plugin;
}
