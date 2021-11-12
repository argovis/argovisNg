import { HttpHeaders } from '@angular/common/http';
const headers = new HttpHeaders()
  .set('X-argokey', 'xxx')

export const environment = {
  production: true,
  apiRoot: 'ARGOVIS_API_ROOT',
  dpRoot: 'ARGOVIS_DP_ROOT',
  apiHeaders: headers
};
