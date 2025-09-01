import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Sidebar, NavSection, NavItem } from '@/components/ui/sidebar';

describe('Sidebar Components', () => {
  it('renders sidebar with navigation role', () => {
    render(
      <Sidebar>
        <div>Test content</div>
      </Sidebar>
    );

    const sidebar = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(sidebar).toBeInTheDocument();
  });

  it('renders nav section with title', () => {
    render(
      <NavSection title="Test Section">
        <div>Test content</div>
      </NavSection>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
    expect(screen.getByText('Test Section')).toHaveClass('font-meta', 'text-xs', 'uppercase');
  });

  it('renders nav section without title', () => {
    render(
      <NavSection>
        <div>Test content</div>
      </NavSection>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders nav item as link with href', () => {
    render(
      <NavItem href="/test">
        Test Link
      </NavItem>
    );

    const link = screen.getByRole('link', { name: 'Test Link' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('renders nav item as button without href', () => {
    render(
      <NavItem onClick={() => {}}>
        Test Button
      </NavItem>
    );

    const button = screen.getByRole('button', { name: 'Test Button' });
    expect(button).toBeInTheDocument();
  });

  it('renders active nav item with correct styling', () => {
    render(
      <NavItem href="/test" isActive>
        Active Item
      </NavItem>
    );

    const link = screen.getByRole('link', { name: 'Active Item' });
    expect(link).toHaveClass('border-ink', 'bg-ink/10', 'text-ink', 'font-medium');
  });

  it('renders nav item with icon', () => {
    const icon = <span data-testid="icon">📁</span>;
    
    render(
      <NavItem href="/test" icon={icon}>
        Item with Icon
      </NavItem>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Item with Icon')).toBeInTheDocument();
  });

  it('applies custom className to nav item', () => {
    render(
      <NavItem href="/test" className="custom-class">
        Custom Item
      </NavItem>
    );

    const link = screen.getByRole('link', { name: 'Custom Item' });
    expect(link).toHaveClass('custom-class');
  });
});
