export default class Values<
  TSchema extends { [key: string]: string } = { [key: string]: string }
> {
  private readonly values: TSchema;

  constructor(values: TSchema) {
    this.values = values;
  }

  get(attribute: string): string {
    const value = this.values[attribute];

    return value !== undefined ? value : '';
  }

  set(attribute: string, value: string) {
    if (this.get(attribute) === value) {
      return this;
    }

    return new Values({
      ...this.values,
      [attribute]: value
    });
  }

  valueOf() {
    return this.values;
  }
}
