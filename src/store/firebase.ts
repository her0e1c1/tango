import * as firebase from 'firebase';
import * as C from 'src/constant';

firebase.initializeApp(C.firebaseConfig);

export const database = firebase.database();
export const auth = firebase.auth();
export { firebase };
