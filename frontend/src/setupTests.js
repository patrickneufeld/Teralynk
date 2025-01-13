import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom matchers
import Contact from './Contact';  // Assuming Contact is a component you want to test

test('renders Contact component with title', () => {
  render(<Contact />);
  const titleElement = screen.getByText(/Contact Us/i); // Get the element with text 'Contact Us'
  
  // Assert that the title element is in the document
  expect(titleElement).toBeInTheDocument(); // Custom matcher from jest-dom
  
  // Assert that the title element contains specific text
  expect(titleElement).toHaveTextContent(/Contact Us/i);
});
