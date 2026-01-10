import { Component, Input } from '@angular/core';
import { Child } from '../../shared/interfaces/child';

@Component({
  selector: 'app-child-reg-table-input',
  imports: [],
  templateUrl: './child-reg-table-input.html',
  styleUrl: './child-reg-table-input.css'
})
export class ChildRegTableInput {


   @Input() child: Child | undefined;

}
