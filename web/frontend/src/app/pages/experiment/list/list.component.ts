import {Component} from "@angular/core";
import {FormBuilder} from "@angular/forms";
import {ExperimentService} from "../../../services/experiment.service";
import {LocalDataSource} from "ng2-smart-table";
import * as moment from 'moment/moment';
import * as _ from 'lodash';
import "style-loader!./list.scss";

@Component({
  selector: 'experiment-list',
  templateUrl: './list.html',
})
export class ExperimentList {
  query: string = '';
  settings = {
    mode: 'external',
    pager: {
      display: true,
      perPage: 20
    },
    actions:{
      delete:true,
      edit:false,
      add:false
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
      submittedAt: {
        title: 'Submitted',
        type: 'text',
        valuePrepareFunction: (value) => { return _.capitalize(this.getDate(value)); }    
      },
      category: {
        title: 'Category',
        type: 'text',
        valuePrepareFunction: (value) => { return _.capitalize(value); }     
      },
      microscope: {
        title: 'Microscope',
        type: 'text'
      },
      status: {
        title: 'Status',
        type: 'text', 
        valuePrepareFunction: (value) => { return _.capitalize(value); }       
      }
      
      // isActive: {
      //   title: 'Is Active ?',
      //   filter: {
      //     type: 'checkbox',
      //     config: {
      //       true: true,
      //       false: false,
      //       resetText: 'clear',
      //     },
      //   },
      // },
    }
  };
  source: LocalDataSource = new LocalDataSource();
  modes: any = {
    LIST: 'listing',
    VIEW: 'viewing',
    CREATE: 'creating',
    UPDATE: 'updating',
  };

  mode: string = this.modes.LIST;
  selected: Object = {
    _id: null,
    name: '',
    description: '',
    permissions: []
  };

  constructor(protected service: ExperimentService, private fb: FormBuilder) {
    this.mode = this.modes.LIST;
    this.preloadData();
  }

  getDate(date):string {
    return moment(date).fromNow();
  }

  loadData(): void {
    let params = {
      page: 1,
      limit: 50
    };

    this.service.getAll(params).subscribe((data) => {
      let experiments = _.each(data.docs, (experiment)=>{
        return experiment;
      })

      this.source.load(experiments);
      this.source.setPaging(data.page, data.limit);
    });
  }

  preloadData(): void {
    let params = {
      page: 1,
      limit: 50
    };

    this.loadData();
  }

  resetForm(): void {
    this.selected = {
      name: '',
      identification: ''
    };
  }

  updateForm(instance): void {
    this.selected = {
      _id: instance._id,
      name: instance.name,
      identification: instance.identification
    };
  }

  onSubmit(event): void {
    switch (this.mode) {
      case this.modes.CREATE:
        this.onCreateConfirm(event);
        break;
      case this.modes.UPDATE:
        this.onEditConfirm(event);
        break;
      default:
        break;
    }
  }

  onCreate(event): void {
    this.mode = this.modes.CREATE;
    this.resetForm();
  }

  onCreateConfirm(event): void {
    let newData = {};
    newData['name'] = event.name;
    newData['identification'] = event.identification;

    this.service.create(newData).subscribe(
      (data) => {
        this.mode = this.modes.LIST;
        this.preloadData();
        this.resetForm();
      },
      (error) => {

      });
  }

  onEdit(event): void {
    this.mode = this.modes.UPDATE;
    this.updateForm(event.data);
  }

  onEditConfirm(event): void {
    let newData = {};
    newData['_id'] = event._id;
    newData['name'] = event.name;
    newData['identification'] = event.identification;

    this.service.update(newData).subscribe(
      (data) => {
        this.mode = this.modes.LIST;
        this.preloadData();
        this.resetForm();
      },
      (error) => {
      });
  }

  onView(event): void {
    this.mode = this.modes.VIEW;
    // this.selected = event.data;
  }

  onDeleteConfirm(event): void {
    if (window.confirm('Are you sure you want to delete?')) {
      event.confirm.resolve();
    } else {
      event.confirm.reject();
    }
  }
}
