export const BILLING_APP_LABELS = Object.freeze({
  CHIT_FUND: 'Chit Fund',
  DAILY_COLLECTION: 'Daily Collection',
  VEHICLE_FINANCE: 'Vehicle Finance',
  PERSONAL_LOAN: 'Personal Loan',
  PERSONAL_FINANCE: 'Personal Finance',
  RENTAL_MANAGEMENT: 'Rental Management',
  HOSTEL_MANAGEMENT: 'Hostel Management',
  MUTTON_STALL: 'Mutton Stall',
  HOSPITAL_MANAGEMENT: 'Hospital Management',
  DOCUMENTS: 'Documents',
  VEHICLE_PARKING: 'Vehicle Parking',
});

export const getBillingAppLabel = (appCode) =>
  BILLING_APP_LABELS[appCode] || appCode;
