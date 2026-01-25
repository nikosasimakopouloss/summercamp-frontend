
export interface ICamper {
  _id?: string;
  fullName: string;
  dateOfBirth: string;  // ISO date string
  amka: string;
  visitorType: string;  // e.g., 'child', 'adult'
  additionalInfo?: string;
  healthDeclarationAccepted: boolean;
  parent: string;  // User ID
  createdAt?: string;
  updatedAt?: string;
}

export interface ICheckAmkaResponse {
  available: boolean;
  message?: string;
}