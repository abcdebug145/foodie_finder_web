const CATEGORY_DISPLAY = {
  'nha-hang': 'Nhà hàng',
  'quan-nhau': 'Quán nhậu',
  'quan-an': 'Quán ăn',
  'cafe': 'Cafe',
  'an-vat-via-he': 'Ăn vặt vỉa hè',
  'an-vat': 'Ăn vặt',
  'via-he': 'Vỉa hè'
};

export function formatCategory(cat) {
  if (!cat) return 'Khác';
  const lower = cat.toLowerCase().trim();
  return CATEGORY_DISPLAY[lower] || cat;
}
