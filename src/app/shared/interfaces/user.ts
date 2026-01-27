export interface IPhone {
  type: 'mobile' | 'home' | 'work';
  number: string;
}

export interface IAddress {
  area?: string;
  street?: string;
  number?: string;
  po?: string;
  municipality?: string;
}

export interface ICredentials {
  username: string;
  password: string;
}

export interface IUser {
  _id?: string;
  username: string;
  password: string;
  firstname?: string;
  lastname?: string;
  amka: string;
  email?: string;
  address?: IAddress;
  phone?: IPhone[];
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
}


export interface IBasicUser {
  _id: string;
  username: string;
  firstname?: string;
  lastname?: string;
  amka: string;
  email?: string;
}




export interface ILoggedInUser {
  _id?: string;
  username: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  roles?: string[];
}

export interface ILoginResponse {
  token: string;
  user: IUser;
}

export interface ICheckAmkaResponse {
  available: boolean;
  message?: string;
}