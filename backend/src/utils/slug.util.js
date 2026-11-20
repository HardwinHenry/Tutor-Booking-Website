/**
 * Vietnamese diacritic removal and slug generation utility
 */
const slugify = (text = '') => {
  if (typeof text !== 'string') return '';

  return text
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD') // separate accents from characters
    .replace(/[\u0300-\u036f]/g, '') // remove accent diacritics
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric except space and hyphen
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/^-+|-+$/g, ''); // trim leading & trailing hyphens
};

module.exports = {
  slugify,
};
