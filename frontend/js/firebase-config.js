// Firebase v9 Compat Web SDK Configuration & Initialization
// Storage only — auth is handled via email OTP through backend
const firebaseConfig = {
  apiKey: "AIzaSyAdyuzAsSvI0Lb4ggFyCdcxdOy7UlSk6FU",
  authDomain: "rent-nest-b9e74.firebaseapp.com",
  projectId: "rent-nest-b9e74",
  storageBucket: "rent-nest-b9e74.firebasestorage.app",
  messagingSenderId: "555038678277",
  appId: "1:555038678277:web:7bd30cf28d3d868bb6ab6c",
  measurementId: "G-L7QJZ15GBQ"
};

firebase.initializeApp(firebaseConfig);

const storage = firebase.storage();
window.storage = storage;

console.log("Firebase Storage initialized.");
