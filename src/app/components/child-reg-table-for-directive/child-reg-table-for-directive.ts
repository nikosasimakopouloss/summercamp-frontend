import { Component } from '@angular/core';
import { ChildRegTableInput } from '../child-reg-table-input/child-reg-table-input';
import { Child } from '../../shared/interfaces/child';

@Component({
  selector: 'app-child-reg-table-for-directive',
  imports: [ChildRegTableInput],
  templateUrl: './child-reg-table-for-directive.html',
  styleUrl: './child-reg-table-for-directive.css'
})
export class ChildRegTableForDirective {



child: Child[] = [

{"firstname":"Ryon","lastname":"McRinn","email":"rmcrinn0@infoseek.co.jp"},
{"firstname":"Nestor","lastname":"Seeman","email":"nseeman1@bbc.co.uk"},
{"firstname":"Loise","lastname":"Bassick","email":"lbassick2@addtoany.com"},






]



}
