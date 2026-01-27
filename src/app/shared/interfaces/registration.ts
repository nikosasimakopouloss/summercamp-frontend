import { ICamper } from "./camper";

export interface IRegistration {
  _id?: string;
  campType: string;  // e.g., 'summer', 'winter'
  campPeriod: string;  // e.g., '2024-07-01 to 2024-07-15'
  camper: string ;  // Camper ID
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

export interface IRegistrationResponse {
  _id: string;
  campType: 'Η Φωλιά του Παιδιού' | 'Ο Παράδεισος του Παιδιού';
  campPeriod: 
    'A\' (16/6 - 30/6)' |
    'B\' (17/7 - 15/7)' |
    'Γ\' (16/7 - 30/7)' |
    'Δ\' (31/7 - 14/8) Μόνο για την Φωλιά' |
    'E\' (17/8 - 31/8) Μόνο για την Φωλιά';
  camper: ICamper;  // Populated camper object
  user: {           // Populated user object (partial)
    _id: string;
    username: string;
    firstname?: string;
    lastname?: string;
    amka: string;
    email?: string;
  };
  beneficiary: 'Μητέρα' | 'Πατέρας';
  motherName: string;
  fatherName: string;
  socialSecurityFund?: string;
  registrationDate: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}






export interface ISearchRegistrationRequest {
  amka: string;
}