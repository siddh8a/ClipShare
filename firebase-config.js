// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCmfo5uJAZIrt-X2eoEu-7A_7JxRmbxH_c",
  authDomain: "clipshare-47b2d.firebaseapp.com",
  databaseURL: "https://clipshare-47b2d-default-rtdb.firebaseio.com",
  projectId: "clipshare-47b2d",
  storageBucket: "clipshare-47b2d.firebasestorage.app",
  messagingSenderId: "274779800019",
  appId: "1:274779800019:web:c251365d8b2c0302c52f26",
  measurementId: "G-HE38QJ6773"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();

// Get a reference to the storage service
const storage = firebase.storage();
