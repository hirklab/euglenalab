import {Component} from "@angular/core";
import {FormBuilder} from "@angular/forms";
import {RoleService} from "../../../services/role.service";
import {PermissionService} from "../../../services/permission.service";
import {LocalDataSource} from "ng2-smart-table";
import "style-loader!./list.scss";

@Component({
  selector: 'role-list',
  templateUrl: './list.html',
})
export class RoleList {
  query: string = '';
  settings = {
    mode: 'external',
    pager: {
      display: true,
      perPage: 20
    },
    actions:{
      delete:false
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
      name: {
        title: 'Name',
        type: 'string'
      },
      description: {
        title: 'Description',
        type: 'string'
      },
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

  permissions: any = [];
  permissionsProperties: any = {
    model: 'checked',
    value: '_id',
    label: 'description',
    baCheckboxClass: 'class'
  };

  constructor(protected service: RoleService, private permissionService: PermissionService, private fb: FormBuilder) {
    this.mode = this.modes.LIST;
    this.preloadData();
  }

  loadData(): void {
    let params = {
      page: 1,
      limit: 50
    };

    this.service.getAll(params).subscribe((data) => {
      this.source.load(data.docs);
      this.source.setPaging(data.page, data.limit);
    });
  }

  preloadData(): void {
    let params = {
      page: 1,
      limit: 50
    };

    this.permissionService.getAll(params).subscribe(
      (data) => {
        this.permissions = data.docs.map((permission) => {
          return {
            _id: permission._id,
            name: permission.name,
            description: permission.description,
            checked: false,
            class: 'col-md-3 col-sm-4 col-xs-12'
          };
        });

        this.loadData();
      });
  }

  getPermissionIds(permissions: any): void {
    let newPermissions:any = [].concat(permissions);

    return newPermissions.filter(function (permission) {
      return permission.checked;
    }).map(function (permission) {
      return permission._id;
    });
  }

  resetForm(): void {
    this.selected = {
      name: '',
      description: '',
      permissions: [].concat(this.permissions)
    };
  }

  updateForm(instance): void {
    let chosenPermissions = instance.permissions.map(function (permission) {
      return permission._id;
    });

    this.selected = {
      _id: instance._id,
      name: instance.name,
      description: instance.description,
      permissions: this.permissions.map(function (permission) {
        permission.checked = chosenPermissions.indexOf(permission._id)>=0;
        return permission;
      })
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
    newData['description'] = event.description;
    newData['permissions'] = this.getPermissionIds(event.permissions);

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
    newData['description'] = event.description;
    newData['permissions'] = this.getPermissionIds(event.permissions);

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
