import { Component } from '@angular/core';

import { UserService } from '../../../services/user.service';
import { LocalDataSource } from 'ng2-smart-table';

import 'style-loader!./list.scss';

@Component({
  selector: 'user-list',
  templateUrl: './list.html',
})
export class UserList {

  query: string = '';

  settings = {
    mode:'external',
    pager:{
      display:true,
      perPage:20
    },
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
      username: {
        title: 'Username',
        type: 'string'
      },
      email: {
        title: 'Email',
        type: 'string'
      },
      isActive: {
        title: 'Is Active ?',
        filter: {
          type: 'checkbox',
          config: {
            true: true,
            false: false,
            resetText: 'clear',
          },
        },
        // valuePrepareFunction:(cell, row)=>{
        //   return cell;
        // }
      },
      isVerified: {
        title: 'Is Verified ?',
        filter: {
          type: 'checkbox',
          config: {
            true: true,
            false: false,
            resetText: 'clear',
          },
        },
      },
    }
  };

  source: LocalDataSource = new LocalDataSource();

  constructor(protected service: UserService) {
    this.service.getAll().subscribe((data) => {
      this.source.load(data.docs);
      this.source.setPaging(data.page, data.limit);
    });
  }

  deleteConfirm(event): void {
    if (window.confirm('Are you sure you want to delete?')) {
      event.confirm.resolve();
    } else {
      event.confirm.reject();
    }
  }
}
