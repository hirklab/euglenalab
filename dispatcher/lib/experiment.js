/**
 * Created by shirish.goyal on 2/23/17.
 */


function _objectHasAuthKey(obj, key) {
    if(obj[key]!==null && obj[key]!==undefined &&
        typeof obj[key]==='string' && obj[key].length===32) {
        return true;
    } else {
        return false;
    }
};




