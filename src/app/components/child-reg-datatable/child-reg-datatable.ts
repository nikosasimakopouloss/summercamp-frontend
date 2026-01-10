import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Child } from '../../shared/interfaces/child';
import {sortBy} from 'lodash-es'

@Component({
  selector: 'app-child-reg-datatable',
  imports: [],
  templateUrl: './child-reg-datatable.html',
  styleUrl: './child-reg-datatable.css'
})
export class ChildRegDatatable {


@Input() data: Child[] | undefined;
  @Output() childClicked = new EventEmitter<Child>()
  




  sortOrder = {
    firstname: 'none',
    lastname: 'none',
    email: 'none'
  }

  sortData(sortKey: keyof Child): void {
    if (this.sortOrder[sortKey]==='asc'){
      this.sortOrder[sortKey] = 'desc';
      this.data = sortBy(this.data, sortKey).reverse();
    } else {
      this.sortOrder[sortKey] = 'asc';
      this.data = sortBy(this.data, sortKey);
    }

    for (let key in this.sortOrder) {
      if (key!==sortKey){
        this.sortOrder[key as keyof Child] = 'none';
      }
    }
  }

sortSign(sortKey: keyof Child): string {
    if (this.sortOrder[sortKey]==='asc') return '\u2191'
    else if (this.sortOrder[sortKey]==='desc') return  '\u2193'
    else return '';
  }


  onPersonClick(child: Child) {

    console.log("Step 6", child);
    this.childClicked.emit(child)
    
  }



  

}
