import {Component} from "@angular/core";
import {FormBuilder} from "@angular/forms";
import {UserService} from "../../../services/user.service";
import {RoleService} from "../../../services/role.service";
import {GroupService} from "../../../services/group.service";
import {LocalDataSource} from "ng2-smart-table";
import {Observable} from "rxjs/Observable";
import "style-loader!./list.scss";

@Component({
  selector: 'user-list',
  templateUrl: './list.html',
})
export class UserList {

  query: string = '';
  settings = {
    mode: 'external',
    pager: {
      display: true,
      perPage: 20
    },
    actions: {
      delete: false
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
      username: {
        title: 'Username',
        type: 'string'
      },
      email: {
        title: 'Email',
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
      //   // valuePrepareFunction:(cell, row)=>{
      //   //   return cell;
      //   // }
      // },
      // isVerified: {
      //   title: 'Is Verified ?',
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
    roles: [],
    groups: []
  };

  roles: any = [];
  rolesProperties: any = {
    model: 'checked',
    value: '_id',
    label: 'description',
    baCheckboxClass: 'class'
  };

  groups: any = [];
  groupsProperties: any = {
    model: 'checked',
    value: '_id',
    label: 'description',
    baCheckboxClass: 'class'
  };

  constructor(protected service: UserService, private groupService: GroupService, private roleService: RoleService, private fb: FormBuilder) {
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

    Observable.forkJoin(
      //get roles
      this.roleService.getAll(params).map(
        (data) => {
          this.roles = data.docs.map((role) => {
            return {
              _id: role._id,
              name: role.name,
              description: role.description,
              checked: false,
              class: 'col-md-3 col-sm-4 col-xs-12'
            };
          });
        }),
      //get groups
      this.groupService.getAll(params).map(
        (data) => {
          this.groups = data.docs.map((group) => {
            return {
              _id: group._id,
              name: group.name,
              description: group.description,
              checked: false,
              class: 'col-md-3 col-sm-4 col-xs-12'
            };
          });
        })
    )
      .subscribe(
        (data) => {
          this.loadData();
        })
  }

  getRoles(params: any): void {
    this.roleService.getAll(params).map(
      (data) => {
        this.roles = data.docs.map((role) => {
          return {
            _id: role._id,
            name: role.name,
            description: role.description,
            checked: false,
            class: 'col-md-3 col-sm-4 col-xs-12'
          };
        });
      });
  }

  getGroups(params: any): void {
    this.groupService.getAll(params).map(
      (data) => {
        this.groups = data.docs.map((group) => {
          return {
            _id: group._id,
            name: group.name,
            description: group.description,
            checked: false,
            class: 'col-md-3 col-sm-4 col-xs-12'
          };
        });
      });
  }

  getRoleIds(roles: any): void {
    let newRoles: any = [].concat(roles);

    return newRoles.filter(function (role) {
      return role.checked;
    }).map(function (role) {
      return role._id;
    });
  }

  getGroupIds(groups: any): void {
    let newGroups: any = [].concat(groups);

    return newGroups.filter(function (group) {
      return group.checked;
    }).map(function (group) {
      return group._id;
    });
  }

  resetForm(): void {
    this.selected = {
      name: '',
      description: '',
      roles: [].concat(this.roles),
      groups: [].concat(this.groups)
    };
  }

  updateForm(instance): void {
    let chosenRoles = instance.roles.map(function (role) {
      return role._id;
    });

    let chosenGroups = instance.groups.map(function (group) {
      return group._id;
    });

    this.selected = {
      _id: instance._id,
      name: instance.name,
      roles: this.roles.map(function (role) {
        role.checked = chosenRoles.indexOf(role._id) >= 0;
        return role;
      }),
      groups: this.groups.map(function (group) {
        group.checked = chosenGroups.indexOf(group._id) >= 0;
        return group;
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
    // newData['description'] = event.description;
    newData['roles'] = this.getRoleIds(event.roles);
    newData['groups'] = this.getGroupIds(event.groups);

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
    // newData['description'] = event.description;
    newData['roles'] = this.getRoleIds(event.roles);
    newData['groups'] = this.getGroupIds(event.groups);

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
