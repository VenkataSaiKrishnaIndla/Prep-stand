import React, { useState } from 'react';
import "../styles/auth.form.scss";
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
const navigate = useNavigate();
const { loading, loginHandle } = useAuth();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

const submitHandle = async (e) => {
    e.preventDefault();

    try {
        await loginHandle({ email, password });
        navigate("/");
    } catch (err) {
        alert(
            err.response?.data?.message ||
            "Login failed. Please check your email and password."
        );
    }
};

if (loading) {
    return <main><h1>Loading...</h1></main>;
}

return (
    <main>
        <div className="form-container">
            <h1>Login</h1>
            <form onSubmit={submitHandle}>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Enter email address"
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Enter password"
                        required
                    />
                </div>

                <button className="button primary-button" type="submit">
                    Login
                </button>
            </form>

            <p>
                Don't have an account? <Link to="/register">Register</Link>
            </p>
        </div>
    </main>
);

};

export default Login;