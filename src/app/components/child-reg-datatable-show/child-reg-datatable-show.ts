import { Component } from '@angular/core';
import { ChildRegDatatable } from '../child-reg-datatable/child-reg-datatable';
import { Child } from '../../shared/interfaces/child';

@Component({
  selector: 'app-child-reg-datatable-show',
  imports: [ChildRegDatatable],
  templateUrl: './child-reg-datatable-show.html',
  styleUrl: './child-reg-datatable-show.css'
})
export class ChildRegDatatableShow {


children: Child[] = [


{"firstname":"Ryon","lastname":"McRinn","email":"rmcrinn0@infoseek.co.jp"},

{"firstname":"Nestor","lastname":"Seeman","email":"nseeman1@bbc.co.uk"},
    {"firstname":"Loise","lastname":"Bassick","email":"lbassick2@addtoany.com"},
    {"firstname":"Murry","lastname":"Holmyard","email":"mholmyard3@toplist.cz"},
    {"firstname":"Gianni","lastname":"Soares","email":"gsoares4@yahoo.com"},
    



]




}
