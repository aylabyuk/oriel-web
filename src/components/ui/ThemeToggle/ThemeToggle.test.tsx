import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

describe('ThemeToggle', () => {
  it('renders the toggle button', () => {
    renderWithProviders(<ThemeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows sun icon in dark mode (default)', () => {
    renderWithProviders(<ThemeToggle />);
    expect(screen.getByRole('button')).toHaveTextContent('\u2600\uFE0F');
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Switch to light mode',
    );
  });

  it('toggles to light mode on click', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ThemeToggle />);

    await user.click(screen.getByRole('button'));
    expect(store.getState().theme.mode).toBe('light');
  });

  it('shows moon icon after toggling to light mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('\uD83C\uDF19');
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Switch to dark mode',
    );
  });

  it('toggles back to dark mode on double click', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ThemeToggle />);

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('button'));
    expect(store.getState().theme.mode).toBe('dark');
  });
});
