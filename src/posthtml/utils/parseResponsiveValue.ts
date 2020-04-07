const parseResponsiveValue = <
  TParsed extends (value: string) => any = (value: string) => any
>(
  rawValue: string | undefined,
  parseValue: TParsed
) => {
  const result: Record<string, ReturnType<TParsed>> = {};

  if (rawValue == null) {
    return new ResponsiveValue(result);
  }

  for (const part of rawValue.split(/\s*,\s*/)) {
    const parsed = /^(.*?)(\d+[whx])?$/.exec(part);

    if (parsed == null) {
      throw new Error(`Invalid attribute value: ${rawValue}`);
    }

    const [_, value, breakpoint] = parsed;

    if (breakpoint != null) {
      result[breakpoint] = parseValue(value);
    } else {
      result.default = parseValue(value);
    }
  }

  return new ResponsiveValue(result);
};

class ResponsiveValue<T> {
  private readonly value: Record<string, T>;

  constructor(value: Record<string, T>) {
    this.value = value;
  }

  get defaultValue(): T | undefined {
    return this.value.default;
  }

  buildMediaQueries(predicate: (value: T) => string): string[] {
    return Object.entries(this.value)
      .filter(([breakpoint]) => breakpoint !== 'default')
      .map(([breakpoint, value]) => {
        let query;

        if (/^\d+w$/.test(breakpoint)) {
          query = `max-width: ${breakpoint.replace('w', '')}px`;
        } else if (/^\d+h$/.test(breakpoint)) {
          query = `max-height: ${breakpoint.replace('h', '')}px`;
        }

        if (query == null) {
          throw new Error(`Invalid query: ${breakpoint}`);
        }

        return `@media screen and (${query}) { ${predicate(value)} }`;
      });
  }

  *[Symbol.iterator]() {
    for (const [breakpoint, value] of Object.entries(this.value)) {
      yield [breakpoint, value];
    }
  }
}

export default parseResponsiveValue;
