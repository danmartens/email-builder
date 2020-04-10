import path from 'path';
import { Template } from './types';
import resizeAndUploadImages from '../server/utils/resizeAndUploadImages';
import Configuration from '../Configuration';

const uploadImages = (template: Template) => (tree, callback) => {
  const { emailsPath } = new Configuration();
  let tasks = 0;

  const done = () => {
    tasks--;

    if (tasks === 0) callback(null, tree);
  };

  tree.match({ tag: 'img', attrs: { 'data-original-src': /^\// } }, (node) => {
    const filePath = path.join(
      emailsPath,
      template.name,
      'assets',
      node.attrs['data-original-src']
    );

    const { name, ext } = path.parse(filePath);

    resizeAndUploadImages(
      {
        path: filePath,
        originalname: `${name}${ext}`
      },
      [
        {
          width: parseInt(
            node.attrs['data-max-width'] || node.attrs.width || 600
          )
        }
      ]
    ).then(([image]) => {
      node.attrs.src = image.objectUrl;

      done();
    });

    tasks++;

    return node;
  });
};

export default uploadImages;
