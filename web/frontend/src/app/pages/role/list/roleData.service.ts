import {Injectable} from '@angular/core';

@Injectable()
export class RoleDataService {

  smartTableData = [
    {
      id: 1,
      name: 'Admin',
      description:'Can perform all actions on the platform',
      isActive: true
    },
    {
      id: 2,
      name: 'Teacher',
      description:'Can manage students and their experiments',
      isActive: true
    },
    {
      id: 3,
      name: 'Student',
      description:'Can manage their own experiments',
      isActive: true
    },
  ];

  getData(): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(this.smartTableData);
      }, 2000);
    });
  }
}
