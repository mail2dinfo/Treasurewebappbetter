export const RM_BASE_PATH = '/rental-management/user';
export const RM_CUSTOMER_BASE_PATH = '/rental-management/customer';

export const RM_APP_MENU_IDS = [
  'company',
  'tenants',
  'properties',
  'agreements',
  'collections',
];

export const getRentalManagementMenuItems = (basePath = RM_BASE_PATH) => [
  {
    id: 'company',
    label: 'Company',
    path: `${basePath}/company`,
    description: 'Company profile setup',
  },
  {
    id: 'tenants',
    label: 'Tenants',
    path: `${basePath}/tenants`,
    description: 'RM subscribers (tenants)',
  },
  {
    id: 'properties',
    label: 'Properties',
    path: `${basePath}/properties`,
    description: 'Property address, photos, materials',
  },
  {
    id: 'agreements',
    label: 'Agreements',
    path: `${basePath}/agreements`,
    description: 'Rental agreements & dual accept',
  },
  {
    id: 'collections',
    label: 'Collections',
    path: `${basePath}/collections`,
    description: 'Monthly rent dues & mark paid',
  },
  {
    id: 'billing',
    label: 'Billing',
    path: `${basePath}/billing`,
    description: 'App subscription & payments',
  },
];

export const getRentalManagementAppMenuItems = (basePath = RM_BASE_PATH) => {
  const homeItem = {
    id: 'home',
    label: 'Home',
    path: `${basePath}/dashboard`,
    description: 'Paid vs pending overview',
  };
  const moduleItems = getRentalManagementMenuItems(basePath).filter((item) =>
    RM_APP_MENU_IDS.includes(item.id)
  );
  return [homeItem, ...moduleItems];
};
