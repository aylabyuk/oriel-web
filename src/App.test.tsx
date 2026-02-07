import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { App } from '@/App';

describe('App', () => {
  it('renders the heading', () => {
    renderWithProviders(<App />);
    expect(screen.getByText('Oriel Absin')).toBeInTheDocument();
  });
});
