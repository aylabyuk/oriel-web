import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { EnvironmentSelector } from '@/components/ui/EnvironmentSelector';

describe('EnvironmentSelector', () => {
  it('renders all 6 preset buttons', () => {
    renderWithProviders(<EnvironmentSelector />);
    const buttons = screen.getAllByRole('radio');
    expect(buttons).toHaveLength(6);
  });

  it('marks sunset as active by default', () => {
    renderWithProviders(<EnvironmentSelector />);
    const sunset = screen.getByRole('radio', { name: 'Sunset' });
    expect(sunset).toHaveAttribute('aria-checked', 'true');
  });

  it('updates Redux state when clicking a preset', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<EnvironmentSelector />);

    await user.click(screen.getByRole('radio', { name: 'Night' }));
    expect(store.getState().theme.environment).toBe('night');
  });

  it('reflects active state after switching preset', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EnvironmentSelector />);

    await user.click(screen.getByRole('radio', { name: 'Forest' }));
    expect(screen.getByRole('radio', { name: 'Forest' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: 'Sunset' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });
});
