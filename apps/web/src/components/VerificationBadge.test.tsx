import { render, screen } from '@testing-library/react';
import { VerificationBadge } from './VerificationBadge';

describe('VerificationBadge', () => {
  it('renders Valid badge', () => {
    render(<VerificationBadge valid={true} />);
    expect(screen.getByText('Valid')).toBeInTheDocument();
  });

  it('renders Invalid badge', () => {
    render(<VerificationBadge valid={false} />);
    expect(screen.getByText('Invalid')).toBeInTheDocument();
  });
});
