export const environment = {
  production: false,
  /** Single base URL — services compose endpoints from this. */
  apiUrl: 'https://dummyjson.com',
  defaultPageSize: 12,
  /**
   * Google OAuth Client ID (Web application).
   * Get one at https://console.cloud.google.com/apis/credentials
   * Set the JavaScript origins to:
   *   http://localhost:4200
   *   http://127.0.0.1:4200
   *   http://<your-LAN-IP>:4200   ← e.g. http://192.168.1.5:4200
   */
  googleClientId: '103301045379-0altosntkeo2vho32k8t5a3opj6epeb4.apps.googleusercontent.com',
};
