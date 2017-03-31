import { Component } from '@angular/core';

import { GroupService } from '../../../services/group.service';
import { LocalDataSource } from 'ng2-smart-table';

import 'style-loader!./list.scss';

@Component({
  selector: 'group-list',
  templateUrl: './list.html',
})
export class GroupList {

  query: string = '';

  settings = {
    mode:'external',
    add: {
      addButtonContent: '<i class="ion-ios-plus-outline"></i>',
      createButtonContent: '<i class="ion-checkmark"></i>',
      cancelButtonContent: '<i class="ion-close"></i>',
    },
    edit: {
      editButtonContent: '<i class="ion-edit"></i>',
      saveButtonContent: '<i class="ion-checkmark"></i>',
      cancelButtonContent: '<i class="ion-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="ion-trash-a"></i>',
      confirmDelete: true
    },
    columns: {
      // id: {
      //   title: 'ID',
      //   type: 'number'
      // },
      name: {
        title: 'Name',
        type: 'string'
      },
      description: {
        title: 'Description',
        type: 'string'
      }
    }
  };

  source: LocalDataSource = new LocalDataSource();

  constructor(protected service: GroupService) {
    this.service.getAll().subscribe((data) => {
      this.source.load(data);
    });
  }

  onDeleteConfirm(event): void {
    if (window.confirm('Are you sure you want to delete?')) {
      event.confirm.resolve();
    } else {
      event.confirm.reject();
    }
  }
}
