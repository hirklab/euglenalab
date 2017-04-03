import {LocalDataSource} from "ng2-smart-table";

// export class ServerDataSource extends LocalDataSource{
//   setPaging(page: number, perPage: number, total:number, pages:number, doEmit: boolean = true): ServerDataSource {
//     this.pagingConf['page'] = page;
//     this.pagingConf['perPage'] = perPage;
//     this.pagingConf['total'] = total;
//     this.pagingConf['pages'] = pages;
//     // this.count=total;
//
//     super.setPaging(page, perPage, doEmit);
//     return this;
//   }
//
//   // protected paginate(data: Array<any>): Array<any> {
//   //   if (this.pagingConf && this.pagingConf['page'] && this.pagingConf['perPage']) {
//   //     data = LocalPager.paginate(data, this.pagingConf['page'], this.pagingConf['perPage']);
//   //   }
//   //   return data;
//   // }
// }
