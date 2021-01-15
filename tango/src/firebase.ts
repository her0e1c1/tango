import * as C from 'src/constant';
import * as firebase from 'firebase';

require('firebase/firestore');
require('firebase/auth');

firebase.initializeApp(C.FIREBASE_CONFIG);

export const db = firebase.firestore();
export const auth = firebase.auth();