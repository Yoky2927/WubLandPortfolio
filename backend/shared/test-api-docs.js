// backend/shared/test-api-docs.js
import { ApiDocs } from './api-docs.js';

console.log('Testing ApiDocs module...');
console.log('Services:', Object.keys(ApiDocs.services));

// Test creating a route
const route = ApiDocs.createRoute('GET', '/api/test', 'Test endpoint', false);
console.log('Created route:', route);

// Test generating docs
const docs = ApiDocs.generateDocs('todo', [route]);
console.log('Generated docs:', JSON.stringify(docs, null, 2));