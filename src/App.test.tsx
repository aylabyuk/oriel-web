import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { en } from '@/i18n/en';
import { App } from '@/App';

describe('App', () => {
  it('renders the welcome screen by default', () => {
    renderWithProviders(<App />);
    expect(screen.getByText(en.welcome.title)).toBeInTheDocument();
  });

  it('shows welcome screen while loading after submit', () => {
    renderWithProviders(<App />, {
      preloadedState: {
        visitor: {
          name: 'Oriel',
          company: '',
          nameError: '',
          submitted: true,
          hasEnteredWelcome: true,
        },
      },
    });
    // Welcome screen stays visible until exit transition completes
    expect(screen.getByText(en.welcome.title)).toBeInTheDocument();
  });
});
