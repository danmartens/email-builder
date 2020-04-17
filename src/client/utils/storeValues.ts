const storeValues = (templateName: string, values: object) => {
  try {
    localStorage.setItem(templateName, JSON.stringify(values.valueOf()));
  } catch (error) {
    console.error(error);
  }
};

export default storeValues;
