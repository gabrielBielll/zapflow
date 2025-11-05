import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/input';

describe('Input component', () => {
  it('should render the input and allow typing', () => {
    render(<Input placeholder="Enter text" />);
    const inputElement = screen.getByPlaceholderText(/Enter text/i);
    expect(inputElement).toBeInTheDocument();

    fireEvent.change(inputElement, { target: { value: 'hello' } });
    expect(inputElement.value).toBe('hello');
  });
});
