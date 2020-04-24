declare module 'posthtml-spaceless' {
  import { PostHTML } from 'posthtml';

  const plugin: () => PostHTML.Plugin<unknown>;

  export default plugin;
}
