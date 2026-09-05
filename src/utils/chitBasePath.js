export const getChitBasePath = (pathname = '') => {
  if (String(pathname).includes('/chit-fund/manager')) return '/chit-fund/manager';
  if (String(pathname).includes('/chit-fund/accountant')) return '/chit-fund/accountant';
  return '/chit-fund/user';
};
