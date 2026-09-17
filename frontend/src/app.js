import React, { Fragment } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { publicRoutes, privateRoutes } from './routes/index.js';
import DefaultLayout from './components/Layout/index.js';
import { AuthProvider } from './context/AuthContext.js';
import Header from './components/Layout/component/Header/index.js';
import Toast from './components/Toast/index.js';
import ProtectedRoute from './components/ProtectedRoute/index.js';
import PageTransition from './components/PageTransition/PageTransition.js';
import ChatBox from './components/ChatBox/index.js';

function App() {
    return (
        <AuthProvider>
            <Router>
                <PageTransition>
                    <div className="App">
                        <Toast />
                        <ChatBox />
                        <Header />
                        <Routes>
                            {publicRoutes.map((route, index) => {
                                const Layout = route.layout === null ? Fragment : DefaultLayout;
                                const Page = route.component;
                                return (
                                    <Route
                                        key={`pub-${index}`}
                                        path={route.path}
                                        element={
                                            <ProtectedRoute
                                                access={route.access || 'storefront'}
                                                authRequired={route.authRequired || false}
                                            >
                                                <Layout><Page /></Layout>
                                            </ProtectedRoute>
                                        }
                                    />
                                );
                            })}

                            {privateRoutes.map((route, index) => {
                                const Layout = route.layout === null ? Fragment : DefaultLayout;
                                const Page = route.component;

                                return (
                                    <Route
                                        key={`priv-${index}`}
                                        path={route.path}
                                        element={
                                            <ProtectedRoute
                                                access={route.access || 'storefront'}
                                                authRequired={route.authRequired !== undefined ? route.authRequired : true}
                                            >
                                                <Layout><Page /></Layout>
                                            </ProtectedRoute>
                                        }
                                    />
                                );
                            })}
                        </Routes>
                    </div>
                </PageTransition>
            </Router>
        </AuthProvider>
    );
}

export default App;
