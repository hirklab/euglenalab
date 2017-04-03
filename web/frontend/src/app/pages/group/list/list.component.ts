import {Component} from "@angular/core";
import {GroupService} from "../../../services/group.service";
import {LocalDataSource} from "ng2-smart-table";
import "style-loader!./list.scss";

@Component({
  selector: 'group-list',
  templateUrl: './list.html',
})
export class GroupList {

  query: string = '';

  settings = {
    mode: 'inline',
    pager:{
      display:true,
      perPage:20
    },
    actions:{
      delete:false
    },
    add: {
      addButtonContent: '<i class="ion-ios-plus-outline"></i>',
      createButtonContent: '<i class="ion-checkmark"></i>',
      cancelButtonContent: '<i class="ion-close"></i>',
      confirmCreate: true
    },
    edit: {
      editButtonContent: '<i class="ion-edit"></i>',
      saveButtonContent: '<i class="ion-checkmark"></i>',
      cancelButtonContent: '<i class="ion-close"></i>',
      confirmSave: true
    },
    delete: {
      deleteButtonContent: '<i class="ion-trash-a"></i>',
      confirmDelete: true
    },
    columns: {
      name: {
        title: 'Name',
        type: 'string',
        // filter:false,
      },
      description: {
        title: 'Description',
        type: 'string',
        // filter:false,
      }
    }
  };

  source: LocalDataSource = new LocalDataSource();

  constructor(protected service: GroupService) {
    let params = {
      page:1,
      limit:50
    };

    this.service.getAll(params).subscribe((data) => {
      this.source.load(data.docs);
      // this.source.setPaging(data.page, data.limit);
    });
  }

  onCreateConfirm(event): void {
    this.service.create(event.newData).subscribe(
      (data) => {
        event.confirm.resolve();
      },
      (error) => {
        event.confirm.reject();
      });
  }

  onEditConfirm(event): void {
    console.log(event);
    this.service.update(event.newData).subscribe(
      (data) => {
        event.confirm.resolve();
      },
      (error) => {
        event.confirm.reject();
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
