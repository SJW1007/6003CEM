// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home';
import SignUp from './SignUp';
import ForgetPassword from './ForgetPassword';
import Login from './Login';
import BookDetail from './BookDetails';
import PrivateRoute from './PrivateRoute';
import Profile from './Profile';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />        {/* 👈 Make Login the landing page */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgetpassword" element={<ForgetPassword/>} />
        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile/></PrivateRoute>} />
        <Route path="/book/:bookKey/*" element={<PrivateRoute><BookDetail /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}
