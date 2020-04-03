import uniqueId from 'lodash/uniqueId';
import pipe from './utils/pipe';
import mergeStyle from './utils/mergeStyle';
import mergeAttrs from './utils/mergeAttrs';
import addClass from './utils/addClass';
import { Node } from './types';

const imageElement = (emailName: string) => (tree) => {
  const transformedNodes = new WeakSet<Node>();

  tree.match(
    { tag: 'img' },
    (node: Node): Node => {
      if (transformedNodes.has(node)) {
        return node;
      }

      const id = uniqueId('image-');
      const width = node.attrs.width || node.attrs['max-width'];

      let src = node.attrs.src;

      if (node.attrs?.src?.startsWith('/')) {
        src = `/assets/${emailName}/${node.attrs.src.replace(/^\//, '')}`;
      }

      const nonRetinaImage = pipe(
        mergeStyle({
          width: '100%',
          'max-width': `${width}px`
        }),
        mergeAttrs({
          src,
          width
        }),
        addClass('non-retina-image')
      )(node);

      const retinaImage = pipe(
        mergeStyle({
          display: 'none',
          width: '100%',
          'max-width': `${width}px`
        }),
        mergeAttrs({
          id,
          src
        }),
        addClass('retina-image')
      )(node);

      transformedNodes.add(nonRetinaImage);
      transformedNodes.add(retinaImage);

      return {
        tag: 'div',
        attrs: {},
        content: [
          nonRetinaImage,
          '<!--[if !mso]>-->',
          retinaImage,
          '<!--<![endif]-->',
          {
            tag: 'style',
            attrs: {},
            content: [
              `@media only screen (-webkit-max-device-pixel-ratio: 1.99),
                              (max-resolution: 191dpi) {
                #${id} {
                  width: 100% !important;
                  max-width: ${width}px !important;
                }
              }`
            ]
          }
        ]
      };
    }
  );
};

export default imageElement;
