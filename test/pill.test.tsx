import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Pill } from '@/components/ui/pill';

describe('Pill Component', () => {
  it('renders pill with default variant and size', () => {
    render(<Pill>Test Pill</Pill>);

    const pill = screen.getByText('Test Pill');
    expect(pill).toBeInTheDocument();
    expect(pill).toHaveClass('border-ink/30', 'text-ink/70', 'px-3', 'py-1.5', 'text-sm');
  });

  it('renders active variant pill', () => {
    render(<Pill variant="active">Active Pill</Pill>);

    const pill = screen.getByText('Active Pill');
    expect(pill).toHaveClass('border-ink', 'bg-ink', 'text-paper');
  });

  it('renders outline variant pill', () => {
    render(<Pill variant="outline">Outline Pill</Pill>);

    const pill = screen.getByText('Outline Pill');
    expect(pill).toHaveClass('border-ink/30', 'text-ink/70');
  });

  it('renders small size pill', () => {
    render(<Pill size="sm">Small Pill</Pill>);

    const pill = screen.getByText('Small Pill');
    expect(pill).toHaveClass('px-2', 'py-1', 'text-xs');
  });

  it('renders medium size pill', () => {
    render(<Pill size="md">Medium Pill</Pill>);

    const pill = screen.getByText('Medium Pill');
    expect(pill).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('applies custom className', () => {
    render(<Pill className="custom-class">Custom Pill</Pill>);

    const pill = screen.getByText('Custom Pill');
    expect(pill).toHaveClass('custom-class');
  });

  it('renders pill with complex content', () => {
    render(
      <Pill>
        <span>Complex</span> <strong>Content</strong>
      </Pill>
    );

    expect(screen.getByText('Complex')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
