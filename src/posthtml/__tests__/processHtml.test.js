import { processHtml } from '../processHtml';

async function normalizeAndProcessHtml(html, options = {}) {
  const { tree } = await processHtml(
    { name: 'test' },
    options,
    html
      .replace(/^\s*/, '')
      .replace(/\s*$/, '')
      .replace(/>\s+/g, '>')
      .replace(/\s+</g, '<')
  );

  return [...tree];
}

test('moves styles inline and moves @media rules to the head', async () => {
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

test('removes regular classes and adds "data-class" classes', async () => {
  const tree = await normalizeAndProcessHtml(`
    <html>
      <body>
        <div class="remove-me" data-class="add-me" />
      </body>
    </html>
  `);

  expect(tree).toMatchObject([
    {
      content: [
        { tag: 'body', content: [{ tag: 'div', attrs: { class: 'add-me' } }] }
      ],
      tag: 'html'
    }
  ]);
});

test('throws when publish and stripMediaQueries options are both set', () => {
  expect(() =>
    processHtml(
      { name: 'test' },
      { publish: true, stripMediaQueries: true },
      '<html></html>'
    )
  ).toThrow('"stripMediaQueries" option should not be used when publishing');
});

test('converts data-max-width to a max-width constrained table', async () => {
  const tree = await normalizeAndProcessHtml(`
    <html>
      <head></head>
      <body>
        <div data-max-width="600">content</div>
      </body>
    </html>
  `);

  const body = tree[0].content.find((n) => n.tag === 'body');
  const table = body.content.find((n) => n.tag === 'table');

  expect(table).toMatchObject({
    tag: 'table',
    attrs: expect.objectContaining({
      width: '600',
      style: expect.stringContaining('max-width: 600px')
    })
  });
});

test('converts data-padding to a table with top, side, and bottom padding cells', async () => {
  const tree = await normalizeAndProcessHtml(`
    <html>
      <head></head>
      <body>
        <div data-padding="20">content</div>
      </body>
    </html>
  `);

  const body = tree[0].content.find((n) => n.tag === 'body');
  const table = body.content.find((n) => n.tag === 'table');

  expect(table).toMatchObject({
    tag: 'table',
    attrs: expect.objectContaining({
      style: expect.stringContaining('width: 100%')
    }),
    content: expect.arrayContaining([
      // top padding row
      expect.objectContaining({
        tag: 'tr',
        content: [
          expect.objectContaining({
            tag: 'td',
            attrs: expect.objectContaining({ height: '20' })
          })
        ]
      }),
      // content row with left and right padding cells
      expect.objectContaining({
        tag: 'tr',
        content: expect.arrayContaining([
          expect.objectContaining({
            tag: 'td',
            attrs: expect.objectContaining({ width: '20' })
          })
        ])
      }),
      // bottom padding row
      expect.objectContaining({
        tag: 'tr',
        content: [
          expect.objectContaining({
            tag: 'td',
            attrs: expect.objectContaining({ height: '20' })
          })
        ]
      })
    ])
  });
});

test('converts data-align to a table with an aligned content cell', async () => {
  const tree = await normalizeAndProcessHtml(`
    <html>
      <head></head>
      <body>
        <div data-align="center">content</div>
      </body>
    </html>
  `);

  const body = tree[0].content.find((n) => n.tag === 'body');
  const table = body.content.find((n) => n.tag === 'table');
  const row = table.content.find((n) => n.tag === 'tr');
  const cell = row.content.find((n) => n.tag === 'td');

  expect(cell).toMatchObject({
    tag: 'td',
    attrs: expect.objectContaining({ align: 'center' })
  });
});

test('converts data-background to a table with a background color', async () => {
  const tree = await normalizeAndProcessHtml(`
    <html>
      <head></head>
      <body>
        <div data-background="#ff0000">content</div>
      </body>
    </html>
  `);

  const body = tree[0].content.find((n) => n.tag === 'body');
  const table = body.content.find((n) => n.tag === 'table');

  expect(table).toMatchObject({
    tag: 'table',
    attrs: expect.objectContaining({ bgcolor: '#ff0000' })
  });
});

test('converts markdown syntax attribute to HTML', async () => {
  const tree = await normalizeAndProcessHtml(`
    <html>
      <body>
        <div syntax="markdown">**bold**</div>
      </body>
    </html>
  `);

  const body = tree[0].content.find((n) => n.tag === 'body');
  const div = body.content.find((n) => n.tag === 'div');

  expect(div.attrs).not.toHaveProperty('syntax');
  expect(div.content).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        tag: 'p',
        content: expect.arrayContaining([
          expect.objectContaining({ tag: 'strong', content: ['bold'] })
        ])
      })
    ])
  );
});

test('renders unsubscribe element as a link in development mode', async () => {
  const tree = await normalizeAndProcessHtml(`
    <html>
      <body>
        <unsubscribe>Unsubscribe</unsubscribe>
      </body>
    </html>
  `);

  const body = tree[0].content.find((n) => n.tag === 'body');
  const link = body.content.find((n) => n.tag === 'a');

  expect(link).toMatchObject({
    tag: 'a',
    attrs: expect.objectContaining({ href: '#' }),
    content: ['Unsubscribe']
  });
});

test('does not convert unsubscribe element in publish mode', async () => {
  const tree = await normalizeAndProcessHtml(
    `
    <html>
      <body>
        <unsubscribe>Unsubscribe</unsubscribe>
      </body>
    </html>
  `,
    { publish: true }
  );

  const body = tree[0].content.find((n) => n.tag === 'body');
  const node = body.content.find((n) => n.tag === 'unsubscribe');

  expect(node).toMatchObject({ tag: 'unsubscribe' });
});

test('adds target and rel attributes to links in development mode', async () => {
  const tree = await normalizeAndProcessHtml(`
    <html>
      <body>
        <a href="https://example.com">Link</a>
      </body>
    </html>
  `);

  const body = tree[0].content.find((n) => n.tag === 'body');
  const link = body.content.find((n) => n.tag === 'a');

  expect(link).toMatchObject({
    tag: 'a',
    attrs: {
      href: 'https://example.com',
      target: '_blank',
      rel: 'noopener noreferrer'
    }
  });
});

test('strips padding declarations from styles when stripPadding is set', async () => {
  const tree = await normalizeAndProcessHtml(
    `
    <html>
      <head></head>
      <body>
        <style>
          p { padding: 20px; color: red; }
        </style>
        <p>text</p>
      </body>
    </html>
  `,
    { stripPadding: true }
  );

  const body = tree[0].content.find((n) => n.tag === 'body');
  const p = body.content.find((n) => n.tag === 'p');

  expect(p.attrs.style).toContain('color: red');
  expect(p.attrs.style).not.toContain('padding');
});

test('strips non-standard font families from styles when stripCustomFonts is set', async () => {
  const tree = await normalizeAndProcessHtml(
    `
    <html>
      <head></head>
      <body>
        <style>
          p { font-family: "Helvetica Neue", Arial, sans-serif; }
        </style>
        <p>text</p>
      </body>
    </html>
  `,
    { stripCustomFonts: true }
  );

  const body = tree[0].content.find((n) => n.tag === 'body');
  const p = body.content.find((n) => n.tag === 'p');

  expect(p.attrs.style).toContain('Arial');
  expect(p.attrs.style).not.toContain('Helvetica');
});

test('adds default border and spacing attributes to tables', async () => {
  const tree = await normalizeAndProcessHtml(`
    <html>
      <body>
        <table>
          <tr><td>cell</td></tr>
        </table>
      </body>
    </html>
  `);

  const body = tree[0].content.find((n) => n.tag === 'body');
  const table = body.content.find((n) => n.tag === 'table');

  expect(table).toMatchObject({
    tag: 'table',
    attrs: {
      border: '0',
      cellspacing: '0',
      cellpadding: '0',
      style: expect.stringContaining('border-collapse: collapse')
    }
  });
});

test('resolves CSS custom properties', async () => {
  const tree = await normalizeAndProcessHtml(`
    <html>
      <head></head>
      <body>
        <style>
          :root { --brand-color: blue; }
          p { color: var(--brand-color); }
        </style>
        <p>text</p>
      </body>
    </html>
  `);

  const body = tree[0].content.find((n) => n.tag === 'body');
  const p = body.content.find((n) => n.tag === 'p');

  expect(p.attrs.style).toContain('color: blue');
});
