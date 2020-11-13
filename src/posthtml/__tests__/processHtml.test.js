import processHtml from '../processHtml';

const normalizeAndProcessHtml = async (html) => {
  const { tree } = await processHtml(
    { name: 'test' },
    {},
    html
      .replace(/^\s*/, '')
      .replace(/\s*$/, '')
      .replace(/>\s+/g, '>')
      .replace(/\s+</g, '<')
  );

  return [...tree];
};

test('inlines styles and moves @media rules to the head', async () => {
  const tree = await normalizeAndProcessHtml(`
    <html>
      <head></head>

      <body>
        <style>
          body { color: red; }
        </style>

        <style>
          body { background: blue; }

          @media screen and (min-width: 600px) {
            body { background: green; }
          }
        </style>
      </body>
    </html>
  `);

  expect(tree).toMatchObject([
    {
      content: [
        {
          tag: 'head',
          content: [
            {
              tag: 'style',
              content: [
                `@media screen and (min-width: 600px) {
            body { background: green; }
          }`
              ]
            }
          ]
        },
        { tag: 'body', attrs: { style: 'color: red; background: blue' } }
      ],
      tag: 'html'
    }
  ]);
});

test('converts srcset to multiple images with media queries', async () => {
  const tree = await normalizeAndProcessHtml(`
    <html>
      <head></head>

      <body>
        <img width="400" srcset="/large.jpg 2x, /small.jpg" />
      </body>
    </html>
  `);

  expect(tree).toMatchObject([
    {
      content: [
        {
          tag: 'head',
          content: [
            {
              tag: 'style',
              content: [
                `@media only screen and (-webkit-max-device-pixel-ratio: 1.99),
                                      (max-resolution: 191dpi) {
                #i1 {
                  width: 100% !important;
                  max-width: 400px !important;
                }
              }`
              ]
            }
          ]
        },
        {
          tag: 'body',
          content: [
            {
              tag: 'img',
              attrs: {
                src: '/assets/test/small.jpg',
                width: '400',
                class: 'non-retina-image',
                style: 'width: 100%; max-width: 400px'
              }
            },
            '<!--[if !mso]>-->',
            {
              tag: 'img',
              attrs: {
                id: 'i1',
                src: '/assets/test/large.jpg',
                width: '400',
                class: 'retina-image',
                style: 'display: none; width: 100%; max-width: 400px'
              }
            },
            '<!--<![endif]-->'
          ]
        }
      ],
      tag: 'html'
    }
  ]);
});
