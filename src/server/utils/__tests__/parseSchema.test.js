import { parseSchema } from '../parseSchema';

test('parses an empty schema', () => {
  expect(parseSchema('[]')).toEqual([]);
});

test('parses a string field', () => {
  const schema = parseSchema(
    JSON.stringify([{ type: 'string', name: 'headline', label: 'Headline' }]),
  );

  expect(schema).toEqual([
    {
      type: 'string',
      name: 'headline',
      label: 'Headline',
      defaultValue: undefined,
    },
  ]);
});

test('parses a string field with a default value', () => {
  const schema = parseSchema(
    JSON.stringify([
      {
        type: 'string',
        name: 'headline',
        label: 'Headline',
        defaultValue: 'Hello World',
      },
    ]),
  );

  expect(schema[0].defaultValue).toBe('Hello World');
});

test('parses a text field', () => {
  const schema = parseSchema(
    JSON.stringify([{ type: 'text', name: 'body', label: 'Body' }]),
  );

  expect(schema).toEqual([
    { type: 'text', name: 'body', label: 'Body', defaultValue: undefined },
  ]);
});

test('parses an image field', () => {
  const schema = parseSchema(
    JSON.stringify([{ type: 'image', name: 'hero', label: 'Hero Image' }]),
  );

  expect(schema[0]).toMatchObject({
    type: 'image',
    name: 'hero',
    label: 'Hero Image',
  });
});

test('parses an image field with a default value', () => {
  const schema = parseSchema(
    JSON.stringify([
      {
        type: 'image',
        name: 'hero',
        label: 'Hero Image',
        defaultValue: { src: '/hero.jpg' },
      },
    ]),
  );

  expect(schema[0].defaultValue).toEqual({
    src: '/hero.jpg',
    srcset: undefined,
  });
});

test('parses an image field with srcset in the default value', () => {
  const schema = parseSchema(
    JSON.stringify([
      {
        type: 'image',
        name: 'hero',
        label: 'Hero Image',
        defaultValue: { src: '/hero.jpg', srcset: '/hero@2x.jpg 2x' },
      },
    ]),
  );

  expect(schema[0].defaultValue).toEqual({
    src: '/hero.jpg',
    srcset: '/hero@2x.jpg 2x',
  });
});

test('parses an image field with dimensions', () => {
  const schema = parseSchema(
    JSON.stringify([
      {
        type: 'image',
        name: 'hero',
        label: 'Hero Image',
        dimensions: { maxWidth: 600, maxHeight: 400 },
      },
    ]),
  );

  expect(schema[0].dimensions).toEqual({ maxWidth: 600, maxHeight: 400 });
});

test('parses a list field', () => {
  const schema = parseSchema(
    JSON.stringify([
      {
        type: 'list',
        name: 'items',
        label: 'Items',
        schema: [{ type: 'string', name: 'title', label: 'Title' }],
      },
    ]),
  );

  expect(schema[0]).toMatchObject({
    type: 'list',
    name: 'items',
    label: 'Items',
    schema: [{ type: 'string', name: 'title', label: 'Title' }],
  });
});

test('parses a list field with mixed field types in its schema', () => {
  const schema = parseSchema(
    JSON.stringify([
      {
        type: 'list',
        name: 'items',
        label: 'Items',
        schema: [
          { type: 'string', name: 'title', label: 'Title' },
          { type: 'text', name: 'body', label: 'Body' },
          { type: 'image', name: 'photo', label: 'Photo' },
        ],
      },
    ]),
  );

  expect(schema[0].schema).toHaveLength(3);
  expect(schema[0].schema[0].type).toBe('string');
  expect(schema[0].schema[1].type).toBe('text');
  expect(schema[0].schema[2].type).toBe('image');
});

test('parses a schema with multiple field types', () => {
  const schema = parseSchema(
    JSON.stringify([
      { type: 'string', name: 'headline', label: 'Headline' },
      { type: 'text', name: 'body', label: 'Body' },
      { type: 'image', name: 'hero', label: 'Hero' },
      {
        type: 'list',
        name: 'items',
        label: 'Items',
        schema: [{ type: 'string', name: 'label', label: 'Label' }],
      },
    ]),
  );

  expect(schema).toHaveLength(4);
});

test('throws on invalid JSON', () => {
  expect(() => parseSchema('not json')).toThrow();
});

test('throws when the schema is not an array', () => {
  expect(() =>
    parseSchema(JSON.stringify({ type: 'string', name: 'x', label: 'X' })),
  ).toThrow('Invalid schema');
});

test('throws when a field is missing its type', () => {
  expect(() =>
    parseSchema(JSON.stringify([{ name: 'headline', label: 'Headline' }])),
  ).toThrow('Invalid schema');
});

test('throws when a field is missing its name', () => {
  expect(() =>
    parseSchema(JSON.stringify([{ type: 'string', label: 'Headline' }])),
  ).toThrow('Invalid schema');
});

test('throws when a field is missing its label', () => {
  expect(() =>
    parseSchema(JSON.stringify([{ type: 'string', name: 'headline' }])),
  ).toThrow('Invalid schema');
});

test('throws when a field has an unknown type', () => {
  expect(() =>
    parseSchema(
      JSON.stringify([
        { type: 'unknown', name: 'headline', label: 'Headline' },
      ]),
    ),
  ).toThrow('Invalid schema');
});

test('throws when an image defaultValue is missing src', () => {
  expect(() =>
    parseSchema(
      JSON.stringify([
        {
          type: 'image',
          name: 'hero',
          label: 'Hero Image',
          defaultValue: { srcset: '/hero@2x.jpg 2x' },
        },
      ]),
    ),
  ).toThrow('Invalid schema');
});

test('throws when a list field is missing its schema', () => {
  expect(() =>
    parseSchema(
      JSON.stringify([{ type: 'list', name: 'items', label: 'Items' }]),
    ),
  ).toThrow('Invalid schema');
});

test('throws when a list schema contains an invalid field', () => {
  expect(() =>
    parseSchema(
      JSON.stringify([
        {
          type: 'list',
          name: 'items',
          label: 'Items',
          schema: [{ type: 'unknown', name: 'title', label: 'Title' }],
        },
      ]),
    ),
  ).toThrow('Invalid schema');
});
