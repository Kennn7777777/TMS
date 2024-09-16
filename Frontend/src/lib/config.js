import axios from 'axios';

export const api = axios.create({
	baseURL: 'http://localhost:3000/api',
	// this ensures subsequent request will send cookies automatically
	withCredentials: true
});

// The withCredentials property is essential for sending cookies
// automatically with each request, as it allows cookies, authorization headers,
// and TLS client certificates to be sent along with the HTTP requests.
// https://www.dhiwise.com/post/managing-secure-cookies-via-axios-interceptors
