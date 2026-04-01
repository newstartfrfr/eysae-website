export const firebaseConfig = {
  apiKey: "AIzaSyAfC9V2L-p6t-pDxcQT76IngV47COS23hc",
  authDomain: "eysae-community.firebaseapp.com",
  projectId: "eysae-community",
  storageBucket: "eysae-community.firebasestorage.app",
  messagingSenderId: "269381879732",
  appId: "1:269381879732:web:7f2ce632d99483f63454e1"
};

export function firebaseIsConfigured(config) {
  return Boolean(
    config &&
      config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.appId
  );
}
