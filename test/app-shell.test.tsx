import { render, screen } from '@testing-library/react';
import { AppShell, AppShellNavigation, AppShellContent } from '@/components/app-shell';

describe('AppShell Components', () => {
  describe('AppShell', () => {
    it('renders with responsive grid layout', () => {
      render(
        <AppShell>
          <div>Navigation</div>
          <div>Content</div>
        </AppShell>
      );
      
      const shell = screen.getByText('Navigation').closest('.grid');
      expect(shell).toHaveClass('grid-cols-1', 'lg:grid-cols-[280px_1fr]', 'min-h-screen');
    });

    it('applies custom className', () => {
      render(
        <AppShell className="custom-shell">
          <div>Navigation</div>
          <div>Content</div>
        </AppShell>
      );
      
      // The custom className should be applied to the outer container
      const shell = document.querySelector('.custom-shell');
      expect(shell).toBeInTheDocument();
      expect(shell).toHaveClass('min-h-screen', 'bg-paper');
    });
  });

  describe('AppShellNavigation', () => {
    it('renders with proper navigation styling', () => {
      render(
        <AppShellNavigation>
          <div>Nav content</div>
        </AppShellNavigation>
      );
      
      const nav = screen.getByText('Nav content').closest('nav');
      expect(nav).toHaveClass('border-r-2', 'border-ink', 'bg-gray');
    });

    it('has proper accessibility attributes', () => {
      render(
        <AppShellNavigation>
          <div>Nav content</div>
        </AppShellNavigation>
      );
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('applies responsive sticky positioning', () => {
      render(
        <AppShellNavigation>
          <div>Nav content</div>
        </AppShellNavigation>
      );
      
      const nav = screen.getByText('Nav content').closest('nav');
      expect(nav).toHaveClass('lg:sticky', 'lg:top-0', 'lg:h-screen', 'lg:overflow-y-auto');
    });
  });

  describe('AppShellContent', () => {
    it('renders with proper content styling', () => {
      render(
        <AppShellContent>
          <div>Main content</div>
        </AppShellContent>
      );
      
      const main = screen.getByText('Main content').closest('main');
      expect(main).toHaveClass('p-4', 'lg:p-6');
    });

    it('has proper accessibility attributes', () => {
      render(
        <AppShellContent>
          <div>Main content</div>
        </AppShellContent>
      );
      
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'main-content');
    });
  });

  describe('Complete AppShell', () => {
    it('renders navigation and content together', () => {
      render(
        <AppShell>
          <AppShellNavigation>
            <div>Navigation</div>
          </AppShellNavigation>
          <AppShellContent>
            <div>Main content</div>
          </AppShellContent>
        </AppShell>
      );
      
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Main content')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});
