import posthtml from 'posthtml';
import spaceless from 'posthtml-spaceless';
import inlineCSS from 'posthtml-inline-css';
import compact from 'lodash/compact';
import normalizeElements from './normalizeElements';
import imageElement from './imageElement';
import section from './section';
import syntaxAttribute from './syntaxAttribute';
import removeExtraElements from './removeExtraElements';
import uploadImages from './uploadImages';
import unsubscribeElement from './unsubscribeElement';
import styleElement from './styleElement';
import preprocessStyles from './preprocessStyles';
import minifyStyles from './minifyStyles';
import { Template } from './types';
import removeClassAttributes from './removeClassAttributes';
import moveDataClassAttributes from './moveDataClassAttributes';
import development from './development';

const processHtml = (
  template: Template,
  options: {
    publish: boolean;
    stripMediaQueries: boolean;
  },
  html: string
) => {
  if (options.publish && options.stripMediaQueries) {
    throw new Error(
      'The "stripMediaQueries" option should not be used when publishing'
    );
  }

  return posthtml(
    // @ts-ignore
    compact([
      syntaxAttribute,
      preprocessStyles,
      inlineCSS(),
      section,
      imageElement(template.name),
      options.publish ? undefined : unsubscribeElement,
      styleElement(options),
      removeExtraElements,
      removeClassAttributes,
      moveDataClassAttributes,
      normalizeElements,
      spaceless(),
      options.publish ? undefined : development(options),
      options.publish ? minifyStyles : undefined,
      options.publish ? uploadImages(template) : undefined
    ])
  ).process(html);
};

export default processHtml;
