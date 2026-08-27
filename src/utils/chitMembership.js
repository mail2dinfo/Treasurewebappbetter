/**
 * Company membership used for chit receivables / payables / ledger.
 * Owner rows often use membershipId; staff rows use parent_membership_id.
 *
 * Do not use name.includes("user") — that also matches Manager and Subscriber.
 */
const ROLE_NAMES = ["user", "manager", "accountant", "collector"];

const accountName = (account) =>
  String(account?.accountName || account?.account_name || "").trim().toLowerCase();

const companyIdFromAccount = (account) =>
  account?.parent_membership_id
  || account?.parentMembershipId
  || account?.membershipId
  || account?.membership_id
  || null;

export const getChitCompanyMembershipId = (user) => {
  const accounts = user?.results?.userAccounts || user?.userAccounts || [];
  if (!accounts.length) return null;

  const preferred =
    ROLE_NAMES.map((role) => accounts.find((account) => accountName(account) === role)).find(Boolean)
    || accounts[0];

  return companyIdFromAccount(preferred);
};
