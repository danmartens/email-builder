import deserializeValues from '../deserializeValues';

const schema = [
  { name: 'name', type: 'string', defaultValue: 'Unamed' },
  {
    name: 'friends',
    type: 'list',
    schema: [
      { name: 'name', label: 'Name', type: 'string', defaultValue: 'Unamed' }
    ]
  }
];

test('deserializes string values', () => {
  const values = deserializeValues(
    schema,
    JSON.stringify({ name: 'Bruce Wayne' })
  );

  expect(values.name).toEqual('Bruce Wayne');
});

test('supports default string values', () => {
  const values = deserializeValues(schema, JSON.stringify({}));

  expect(values.name).toEqual('Unamed');
});

test('deserializes list values', () => {
  const values = deserializeValues(
    schema,
    JSON.stringify({ friends: [{ name: 'Alfred' }] })
  );

  expect(values.friends[0].name).toEqual('Alfred');
});

test('supports list item default values', () => {
  const values = deserializeValues(schema, JSON.stringify({ friends: [{}] }));

  expect(values.friends[0].name).toEqual('Unamed');
});
