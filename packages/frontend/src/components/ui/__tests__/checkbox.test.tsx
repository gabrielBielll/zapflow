import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox component', () => {
  it('should render the checkbox and allow checking', () => {
    render(<Checkbox id="test-checkbox" />);
    const checkboxElement = screen.getByRole('checkbox');
    expect(checkboxElement).toBeInTheDocument();
    expect(checkboxElement).not.toBeChecked();

    fireEvent.click(checkboxElement);
    expect(checkboxElement).toBeChecked();
  });
});
