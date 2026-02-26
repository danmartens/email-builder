import { compact } from 'lodash-es';
import posthtml from 'posthtml';
import inlineCSS from 'posthtml-inline-css';
import spaceless from 'posthtml-spaceless';

import { development } from './development';
import { imageElement } from './imageElement';
import { minifyStyles } from './minifyStyles';
import { moveDataClassAttributes } from './moveDataClassAttributes';
import { normalizeElements } from './normalizeElements';
import { preprocessStyles } from './preprocessStyles';
import { removeClassAttributes } from './removeClassAttributes';
import { removeExtraElements } from './removeExtraElements';
import { section } from './section';
import { styleElement } from './styleElement';
import { syntaxAttribute } from './syntaxAttribute';
import type { Template } from './types';
import { unsubscribeElement } from './unsubscribeElement';
import { uploadImages } from './uploadImages';

export function processHtml(
  template: Template,
  options: {
    publish: boolean;
    uploadImages: boolean;
    stripPadding: boolean;
    stripCustomFonts: boolean;
    stripMediaQueries: boolean;
  },
  html: string,
) {
  if (options.publish && options.stripMediaQueries) {
    throw new Error(
      'The "stripMediaQueries" option should not be used when publishing',
    );
  }

  return posthtml(
    compact([
      syntaxAttribute,
      preprocessStyles(options),
      inlineCSS(),
      section,
      imageElement(template.name, options),
      options.publish ? undefined : unsubscribeElement,
      styleElement(options),
      removeExtraElements,
      removeClassAttributes,
      moveDataClassAttributes,
      normalizeElements,
      spaceless(),
      options.publish ? undefined : development(options),
      options.publish ? minifyStyles : undefined,
      options.uploadImages ? uploadImages(template) : undefined,
    ]),
  ).process(html);
}
