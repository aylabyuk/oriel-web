import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { EnvironmentSelector } from '@/components/ui/EnvironmentSelector';

describe('EnvironmentSelector', () => {
  it('shows only the active preset by default', () => {
    renderWithProviders(<EnvironmentSelector />);
    const buttons = screen.getAllByRole('radio');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute('aria-label', 'Sunset');
  });

  it('marks the active preset as checked', () => {
    renderWithProviders(<EnvironmentSelector />);
    const sunset = screen.getByRole('radio', { name: 'Sunset' });
    expect(sunset).toHaveAttribute('aria-checked', 'true');
  });

  it('reveals all options on hover', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EnvironmentSelector />);

    await user.hover(screen.getByRole('radiogroup'));
    const buttons = screen.getAllByRole('radio');
    expect(buttons).toHaveLength(6);
  });

  it('updates Redux state when clicking a preset', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<EnvironmentSelector />);

    // Open the tray first
    await user.hover(screen.getByRole('radiogroup'));
    await user.click(screen.getByRole('radio', { name: 'Night' }));
    expect(store.getState().theme.environment).toBe('night');
  });

  it('collapses after selecting a preset', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EnvironmentSelector />);

    await user.hover(screen.getByRole('radiogroup'));
    await user.click(screen.getByRole('radio', { name: 'Forest' }));

    const active = screen.getByRole('radio', { name: 'Forest' });
    expect(active).toHaveAttribute('aria-checked', 'true');
  });
});
