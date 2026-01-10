import { Routes } from '@angular/router';
import { LogInPage } from './components/log-in-page/log-in-page';
import { CreateUser } from './components/create-user/create-user';
import { UserViewMenu } from './components/user-view-menu/user-view-menu';
import { ChildRegForm } from './components/child-reg-form/child-reg-form';
import { ChildRegTable } from './components/child-reg-table/child-reg-table';
import { ChildRegTableInput } from './components/child-reg-table-input/child-reg-table-input';
import { ChildRegTableForDirective } from './components/child-reg-table-for-directive/child-reg-table-for-directive';
import { ChildRegDatatableShow } from './components/child-reg-datatable-show/child-reg-datatable-show';

export const routes: Routes = [


  { path: '', redirectTo: 'log-in-page', pathMatch: 'full' },
 {path:'log-in-page', component: LogInPage},
 {path:'create-user', component: CreateUser},
 {path: 'user-view-menu', component: UserViewMenu,
  children: [
 { path: 'child-reg-form', component: ChildRegForm },
 { path: 'child-reg-table', component: ChildRegTable},
 {path : 'child-reg-table-input' , component: ChildRegTableInput},

 {path:'child-reg-table-for-directive', component: ChildRegTableForDirective},

 {path: 'child-reg-datatable-show' , component: ChildRegDatatableShow }



  ]

}
];
