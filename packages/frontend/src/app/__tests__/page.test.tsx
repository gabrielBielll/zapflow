import React from 'react';
import { render, screen } from '@testing-library/react';
import Page from '@/app/page';

describe('Home page', () => {
  it('should render the main dashboard heading', () => {
    render(<Page />);
    const headingElement = screen.getByRole('heading', { name: /Novo chatbot/i });
    expect(headingElement).toBeInTheDocument();
  });
});
