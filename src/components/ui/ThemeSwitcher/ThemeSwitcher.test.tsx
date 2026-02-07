import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

describe('ThemeSwitcher', () => {
  it('renders four color options', () => {
    renderWithProviders(<ThemeSwitcher />);
    expect(screen.getAllByRole('radio')).toHaveLength(4);
  });

  it('marks red as selected by default', () => {
    renderWithProviders(<ThemeSwitcher />);
    expect(screen.getByRole('radio', { name: 'Red & Blue' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('updates accent color on click', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ThemeSwitcher />);

    await user.click(screen.getByRole('radio', { name: 'Blue & Yellow' }));
    expect(store.getState().theme.accentColor).toBe('blue');
  });

  it('reflects the current selection visually', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeSwitcher />);

    await user.click(screen.getByRole('radio', { name: 'Green & Red' }));
    expect(
      screen.getByRole('radio', { name: 'Green & Red' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Red & Blue' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });
});
