import path from 'path';
import resizeAndUploadImages from '../server/utils/resizeAndUploadImages';
import Configuration from '../Configuration';
import { PostHTMLNode, Template, PostHTMLPlugin } from './types';

const uploadImages = (template: Template): PostHTMLPlugin => (
  tree,
  callback
) => {
  const { emailsPath } = new Configuration();
  let tasks = 0;

  const done = () => {
    tasks--;

    if (tasks === 0) callback(null, tree);
  };

  tree.match(
    { tag: 'img', attrs: { 'data-original-src': /^\// } },
    (node: PostHTMLNode): PostHTMLNode => {
      tasks++;

      const filePath = path.join(
        emailsPath,
        template.name,
        'assets',
        node.attrs!['data-original-src']!
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
              node.attrs!['data-max-width'] || node.attrs!.width || '600'
            )
          }
        ]
      )
        .then(([image]) => {
          node.attrs!.src = image.objectUrl;
        })
        .finally(done);

      return node;
    }
  );

  if (tasks === 0) callback(null, tree);
};

export default uploadImages;
