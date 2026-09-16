import React from 'react';
import Footer from './component/Footer/index.js';

function DefaultLayout({ children }) {
    return (
        <div className="wrapper">
            <div className="container">{children}</div>
            <Footer />
        </div>
    );
}
export default DefaultLayout;