import processHtml from '../processHtml';

test('inlines styles and moves style tags to the head', async () => {
  const { tree } = await processHtml(
    {},
    {},
    `
      <html>
        <head></head>

        <body>
          <style>
            body { color: red; }
          </style>

          <style>
            body { background: blue; }
          </style>
        </body>
      </html>
    `.replace(/\s+/g, '')
  );

  expect([...tree]).toMatchObject([
    {
      content: [
        {
          tag: 'head',
          content: [
            {
              tag: 'style',
              content: ['body{color:red;}', 'body{background:blue;}']
            }
          ]
        },
        { tag: 'body', attrs: { style: 'color: red; background: blue' } }
      ],
      tag: 'html'
    }
  ]);
});
