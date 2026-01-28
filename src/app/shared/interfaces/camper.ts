import { IUser } from "./user";



export interface IUserParent {
  _id: string;
  username: string;
  firstname: string;
  lastname: string;
  amka: string;
  email: string;
}








export interface ICamper {
  _id?: string;
  fullName: string;
  dateOfBirth: string;  // ISO date string
  amka: string;
  visitorType: string;  // e.g., 'child', 'adult'
  additionalInfo?: string;
  healthDeclarationAccepted: boolean;
  parent: string | IUserParent;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICheckAmkaResponse {
  available: boolean;
  message?: string;
}