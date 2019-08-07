import * as firebase from 'firebase/app';
import * as C from 'src/constant';

require('firebase/firestore');
require('firebase/auth');

firebase.initializeApp(C.FIREBASE_CONFIG);

export const db = firebase.firestore();
export const auth = firebase.auth();

// db.settings({
//   timestampsInSnapshots: true,
// });
