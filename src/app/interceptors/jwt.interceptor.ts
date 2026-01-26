import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';

@Injectable()
export default class JwtInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authToken = localStorage.getItem('access_token');
    
    console.log('🔄 JWT Interceptor called');
    console.log('🔐 Token found?', !!authToken);
    
    if (!authToken) {
      console.log('❌ No token found, sending request without Authorization header');
      return next.handle(req);
    }

    console.log('✅ Adding Authorization header');
    console.log('📤 Request URL:', req.url);
    
    const authRequest = req.clone({
      headers: req.headers.set('Authorization', 'Bearer ' + authToken)  // This syntax is cleaner
    });
    
    return next.handle(authRequest);
  }
}