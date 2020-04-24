import uniqueId from 'lodash/uniqueId';
import pipe from './utils/pipe';
import mergeStyle from './utils/mergeStyle';
import mergeAttrs from './utils/mergeAttrs';
import addClass from './utils/addClass';
import { PostHTMLNode, PostHTMLPlugin } from './types';
import parseResponsiveValue from './utils/parseResponsiveValue';

const imageElement = (emailName: string): PostHTMLPlugin => (tree) => {
  const transformedNodes = new WeakSet<PostHTMLNode>();

  tree.match({ tag: 'img' }, (node) => {
    if (node.attrs == null || transformedNodes.has(node)) {
      return node;
    }

    const id = uniqueId('i');
    const width = node.attrs['data-max-width'] || node.attrs.width;

    const srcset = parseResponsiveValue(
      node.attrs.srcset ?? node.attrs.src,
      (src) => {
        if (src.startsWith('/')) {
          return `/assets/${emailName}/${src.replace(/^\//, '')}`;
        }

        return src;
      }
    );

    let nonRetinaImage = pipe(
      mergeStyle({
        width: '100%',
        'max-width': width != null ? `${width}px` : undefined
      }),
      mergeAttrs({
        src: srcset.defaultValue,
        width,
        'data-original-src': node.attrs.src,
        srcset: undefined
      })
    )(node);

    if (width == null || srcset.get('2x') == null) {
      transformedNodes.add(nonRetinaImage);

      return nonRetinaImage;
    }

    nonRetinaImage = addClass('non-retina-image')(nonRetinaImage);

    const retinaImage = pipe(
      mergeStyle({
        display: 'none',
        width: '100%',
        'max-width': `${width}px`
      }),
      mergeAttrs({
        id,
        src: srcset.get('2x'),
        'data-original-src': node.attrs.src,
        srcset: undefined
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
            `@media only screen and (-webkit-max-device-pixel-ratio: 1.99),
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
  });
};

export default imageElement;
