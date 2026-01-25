export interface IRegistration {
  _id?: string;
  campType: string;  // e.g., 'summer', 'winter'
  campPeriod: string;  // e.g., '2024-07-01 to 2024-07-15'
  camper: string;  // Camper ID
  user: string;  // User ID
  beneficiary: string;  // Camper's name or reference
  motherName: string;
  fatherName: string;
  socialSecurityFund?: string;
  registrationDate: string;  // ISO date string
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  amka: string
}

export interface ISearchRegistrationRequest {
  amka: string;
}