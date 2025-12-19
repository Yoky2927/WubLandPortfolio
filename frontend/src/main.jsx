import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Router from './Router.jsx';
import './index.css';
import { registerLicense } from '@syncfusion/ej2-base';

// Register the Syncfusion license key
registerLicense('Ngo9BigBOggjGyl/Vkd+XU9FcVRDXXxIekx0RWFcb196cFJMYFtBNQtUQF1hTH5ad0FjWHtZdXRXT2NdWkd3');

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <Router />
    </BrowserRouter>
);