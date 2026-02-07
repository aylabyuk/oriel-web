import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { en } from '@/i18n/en';
import { WelcomeScreen } from '@/sections/WelcomeScreen';

describe('WelcomeScreen', () => {
  it('renders the title and subtitle', () => {
    renderWithProviders(<WelcomeScreen />);
    expect(screen.getByText(en.welcome.title)).toBeInTheDocument();
    expect(screen.getByText(en.welcome.subtitle)).toBeInTheDocument();
  });

  it('renders name and company inputs', () => {
    renderWithProviders(<WelcomeScreen />);
    expect(screen.getByLabelText(en.welcome.nameLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(en.welcome.companyLabel)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderWithProviders(<WelcomeScreen />);
    expect(
      screen.getByRole('button', { name: en.welcome.startButton }),
    ).toBeInTheDocument();
  });

  it('auto-focuses the name input', () => {
    renderWithProviders(<WelcomeScreen />);
    expect(screen.getByLabelText(en.welcome.nameLabel)).toHaveFocus();
  });

  it('shows error when submitting with empty name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WelcomeScreen />);

    await user.click(
      screen.getByRole('button', { name: en.welcome.startButton }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      en.welcome.nameRequired,
    );
  });

  it('clears error when typing a valid name after failed submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WelcomeScreen />);

    await user.click(
      screen.getByRole('button', { name: en.welcome.startButton }),
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await user.type(screen.getByLabelText(en.welcome.nameLabel), 'Oriel');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('enters welcome on valid submit', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<WelcomeScreen />);

    await user.type(screen.getByLabelText(en.welcome.nameLabel), 'Oriel');
    await user.type(screen.getByLabelText(en.welcome.companyLabel), 'Acme');
    await user.click(
      screen.getByRole('button', { name: en.welcome.startButton }),
    );

    const { visitor } = store.getState();
    expect(visitor.name).toBe('Oriel');
    expect(visitor.company).toBe('Acme');
    expect(visitor.hasEnteredWelcome).toBe(true);
  });

  it('submits successfully without a company', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<WelcomeScreen />);

    await user.type(screen.getByLabelText(en.welcome.nameLabel), 'Oriel');
    await user.click(
      screen.getByRole('button', { name: en.welcome.startButton }),
    );

    expect(store.getState().visitor.hasEnteredWelcome).toBe(true);
    expect(store.getState().visitor.company).toBe('');
  });
});
