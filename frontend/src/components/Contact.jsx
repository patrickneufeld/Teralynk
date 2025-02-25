import React, { useState } from 'react';
import '../styles/components/Contact.css';
const Contact = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, message }),
            });

            if (response.ok) {
                setSuccess(true);
                setName('');
                setEmail('');
                setMessage('');
                setError('');
            } else {
                setError('Failed to send your message. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <div className="contact-container">
            <h1>Contact Us</h1>
            {success && <p className="success-message">Thank you! Your message has been sent.</p>}
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit}>
                <label>
                    Name:
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Email:
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Message:
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                    ></textarea>
                </label>
                <button type="submit">Send Message</button>
            </form>
        </div>
    );
};

export default Contact;
