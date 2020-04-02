import uniqueId from 'lodash/uniqueId';
import mergeStyle from './utils/mergeStyle';
import mergeAttrs from './utils/mergeAttrs';
import { Node } from './types';

const imageElement = (emailName: string) => (tree) => {
  tree.match(
    { tag: 'img', attrs: { src: /^\/(?!assets)/ } },
    (node: Node): Node => {
      if (!node.attrs?.src?.startsWith('/')) {
        return node;
      }

      const id = uniqueId('image-');
      const src = `/assets/${emailName}/${node.attrs.src.replace(/^\//, '')}`;
      const width = node.attrs.width || node.attrs['max-width'];

      return {
        tag: 'div',
        attrs: {},
        content: [
          mergeAttrs(
            {
              src,
              width
            },
            mergeStyle(
              {
                width: '100%',
                'max-width': `${width}px`
              },
              node
            )
          ),
          '<!--[if !mso]>-->',
          mergeAttrs(
            {
              id,
              src
            },
            mergeStyle(
              {
                display: 'none',
                width: '100%',
                'max-width': `${width}px`
              },
              node
            )
          ),
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
