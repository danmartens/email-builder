import posthtml from 'posthtml';
import spaceless from 'posthtml-spaceless';
import inlineCSS from 'posthtml-inline-css';
import tableElement from './tableElement';
import imageElement from './imageElement';
import section from './section';
import syntaxAttribute from './syntaxAttribute';
import removeExtraElements from './removeExtraElements';
import { Template } from './types';
import uploadImages from './uploadImages';
import unsubscribeElement from './unsubscribeElement';
import styleElement from './styleElement';
import preprocessStyles from './preprocessStyles';
import minifyStyles from './minifyStyles';

const processHtml = (
  template: Template,
  options: {
    publish: boolean;
  },
  html: string
) => {
  return posthtml(
    [
      syntaxAttribute,
      preprocessStyles,
      inlineCSS(),
      section,
      imageElement(template.name),
      tableElement,
      options.publish ? undefined : unsubscribeElement,
      styleElement(options),
      removeExtraElements,
      spaceless(),
      options.publish ? minifyStyles : undefined,
      options.publish ? uploadImages(template) : undefined
    ].filter(Boolean)
  ).process(html);
};

export default processHtml;
