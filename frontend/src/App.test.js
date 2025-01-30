import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';  // Add this import

import App from './App'; // Your App component

test('renders learn react link', () => {
    render(
        <BrowserRouter>  // Wrap the component with BrowserRouter
            <App />
        </BrowserRouter>
    );
    const linkElement = screen.getByText(/learn react/i);
    expect(linkElement).toBeInTheDocument();
});
