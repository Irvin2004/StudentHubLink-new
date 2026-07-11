function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

module.exports = {
  uniqueValues
};
