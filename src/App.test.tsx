import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { en } from '@/i18n/en';
import { App } from '@/App';

describe('App', () => {
  it('renders the welcome screen by default', () => {
    renderWithProviders(<App />);
    expect(screen.getByText(en.welcome.title)).toBeInTheDocument();
  });

  it('renders the environment selector', () => {
    renderWithProviders(<App />);
    expect(screen.getByRole('radiogroup', { name: 'Environment' })).toBeInTheDocument();
  });

  it('renders the main content after entering welcome', () => {
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
    expect(screen.getByText('Oriel Absin')).toBeInTheDocument();
    expect(screen.queryByText(en.welcome.title)).not.toBeInTheDocument();
  });
});
