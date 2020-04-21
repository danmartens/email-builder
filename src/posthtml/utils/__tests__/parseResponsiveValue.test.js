import parseResponsiveValue from '../parseResponsiveValue';

test('parses srcset values', () => {
  const parsed = parseResponsiveValue(
    'large.png 2x, small.png',
    (value) => value
  );

  expect(parsed.defaultValue).toEqual('small.png');

  expect(Array.from(parsed)).toEqual([
    ['2x', 'large.png'],
    ['default', 'small.png']
  ]);
});
