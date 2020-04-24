import 'core-js/es/object/from-entries';

const buildAttrs = (attrs: { [key: string]: string | number | undefined }) => {
  return Object.fromEntries(
    Object.entries(attrs)
      .filter(([, value]) => value != null)
      .map(([key, value]) => [key, value?.toString()])
  );
};

export default buildAttrs;
