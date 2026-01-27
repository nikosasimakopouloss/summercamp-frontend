import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth-guard';
import { adminRoleGuard } from './shared/guards/admin-role-guard';

export const routes: Routes = [
  // Public routes
  { 
    path: 'login', 
    loadComponent: () => import('./components/login.component/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./components/register.component/register.component').then(m => m.RegisterComponent) 
  },
  
  // Protected routes
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard.component/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    children: [
      // { 
      //   path: '', 
      //   loadComponent: () => import('./components/dashboard/overview/overview.component').then(m => m.OverviewComponent) 
      // },
      { 
        path: 'profile', 
        loadComponent: () => import('./components/profile.component/profile.component').then(m => m.ProfileComponent) 
      },
      { 
        path: 'campers', 
        loadComponent: () => import('./components/campers/camper-list.component/camper-list.component').then(m => m.CamperListComponent) 
      },
      { 
        path: 'campers/new', 
        loadComponent: () => import('./components/campers/camper-form.component/camper-form.component').then(m => m.CamperFormComponent) 
      },
      { 
        path: 'campers/edit/:id', 
        loadComponent: () => import('./components/campers/camper-form.component/camper-form.component').then(m => m.CamperFormComponent) 
      },
      { 
        path: 'registrations', 
        loadComponent: () => import('./components/registrations/registration-list.component/registration-list.component').then(m => m.RegistrationListComponent) 
      },
      { 
        path: 'registrations/new', 
        loadComponent: () => import('./components/registrations/registration-form.component/registration-form.component').then(m => m.RegistrationFormComponent) 
      },
      { 
        path: 'registrations/edit/:id', 
        loadComponent: () => import('./components/registrations/registration-form.component/registration-form.component').then(m => m.RegistrationFormComponent) 
      }
      
      // Admin child routes
      // { 
      //   path: 'admin/users', 
      //   loadComponent: () => import('./components/admin/admin-users.component/admin-users.component').then(m => m.AdminUsersComponent),
      //   canActivate: [adminRoleGuard]
      // },
      // { 
      //   path: 'admin/campers', 
      //   loadComponent: () => import('./components/admin/admin-campers.component/admin-campers.component').then(m => m.AdminCampersComponent),
      //   canActivate: [adminRoleGuard]
      // },
      // { 
      //   path: 'registrations/admin/registrations', 
      //   loadComponent: () => import('./components/admin/admin-registrations.component/admin-registrations.component').then(m => m.AdminRegistrationsComponent),
      //   canActivate: [adminRoleGuard]
      // }
    ]
  },



// { 
//   path: 'admin', 
//   canActivate: [authGuard, adminRoleGuard],
//   children: [
//     { 
//       path: 'dashboard', 
//       loadComponent: () => import('./components/admin/admin-dashboard.component/admin-dashboard.component').then(m => m.AdminDashboardComponent),
//       children: [
//         { 
//           path: '', 
//           pathMatch: 'full',
//           redirectTo: 'dashboard'  // Redirect to dashboard 
//         },
        
//         { 
//           path: 'users', 
//           loadComponent: () => import('./components/admin/admin-users.component/admin-users.component').then(m => m.AdminUsersComponent)
//         },
//         { 
//           path: 'campers', 
//           loadComponent: () => import('./components/admin/admin-campers.component/admin-campers.component').then(m => m.AdminCampersComponent)
//         },
//         { 
//           path: 'registrations', 
//           loadComponent: () => import('./components/admin/admin-registrations.component/admin-registrations.component').then(m => m.AdminRegistrationsComponent)
//         }
//       ]
//     }
//   ]
// },


{ 
  path: 'admin', 
  canActivate: [authGuard, adminRoleGuard],
  children: [
    { 
      path: '', 
      pathMatch: 'full',
      redirectTo: 'dashboard'
    },
    { 
      path: 'dashboard', 
      loadComponent: () => import('./components/admin/admin-dashboard.component/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      children: [
        
        { 
          path: 'users', 
          loadComponent: () => import('./components/admin/admin-users.component/admin-users.component').then(m => m.AdminUsersComponent)
        },
        { 
          path: 'campers', 
          loadComponent: () => import('./components/admin/admin-campers.component/admin-campers.component').then(m => m.AdminCampersComponent)
        },
        { 
          path: 'registrations', 
          loadComponent: () => import('./components/admin/admin-registrations.component/admin-registrations.component').then(m => m.AdminRegistrationsComponent)
        }
      ]
    }
  ]
},








  
   









  
  
  // Default redirects
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];