import * as firebase from 'firebase';
import * as C from 'src/constant';

require('firebase/firestore');

firebase.initializeApp(C.FIREBASE_CONFIG);

export const db = firebase.firestore();
db.settings({
  timestampsInSnapshots: true,
});

export const auth = firebase.auth();
