import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders a label and input', () => {
    render(<Input label="Your Name" />);
    expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
  });

  it('shows error message when error prop is provided', () => {
    render(<Input label="Name" error="Required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });

  it('sets aria-invalid when there is an error', () => {
    render(<Input label="Name" error="Required" />);
    expect(screen.getByLabelText('Name')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('links aria-describedby to the error element', () => {
    render(<Input label="Name" error="Required" />);
    const input = screen.getByLabelText('Name');
    const errorId = input.getAttribute('aria-describedby');
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId!)).toHaveTextContent('Required');
  });

  it('does not show error elements when there is no error', () => {
    render(<Input label="Name" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid');
  });

  it('forwards ref correctly', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input label="Name" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
