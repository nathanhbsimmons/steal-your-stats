import { render, screen } from '@testing-library/react';
import { Window, WindowHeader, WindowBody, WindowFooter } from '@/components/ui/window';

describe('Window Components', () => {
  describe('Window', () => {
    it('renders with retro chrome styling', () => {
      render(
        <Window>
          <div>Test content</div>
        </Window>
      );
      
      const window = screen.getByText('Test content').parentElement;
      expect(window).toHaveClass('bg-paper', 'border-2', 'border-ink', 'rounded-radius-xl', 'shadow-window');
    });

    it('applies custom className', () => {
      render(
        <Window className="custom-class">
          <div>Test content</div>
        </Window>
      );
      
      const window = screen.getByText('Test content').parentElement;
      expect(window).toHaveClass('custom-class');
    });
  });

  describe('WindowHeader', () => {
    it('renders with proper header styling', () => {
      render(
        <WindowHeader>
          <span>Header Title</span>
        </WindowHeader>
      );
      
      const header = screen.getByText('Header Title').closest('header');
      expect(header).toHaveClass('border-b-2', 'border-ink', 'bg-ink', 'text-paper');
    });

    it('includes stripe pattern for retro chrome look', () => {
      render(
        <WindowHeader>
          <span>Header Title</span>
        </WindowHeader>
      );
      
      const stripes = document.querySelectorAll('.w-3.h-3.bg-paper.rounded-sm');
      expect(stripes).toHaveLength(3);
    });
  });

  describe('WindowBody', () => {
    it('renders with proper body styling', () => {
      render(
        <WindowBody>
          <div>Body content</div>
        </WindowBody>
      );
      
      const body = screen.getByText('Body content').closest('main');
      expect(body).toHaveClass('p-4');
    });
  });

  describe('WindowFooter', () => {
    it('renders with proper footer styling', () => {
      render(
        <WindowFooter>
          <div>Footer content</div>
        </WindowFooter>
      );
      
      const footer = screen.getByText('Footer content').closest('footer');
      expect(footer).toHaveClass('border-t-2', 'border-ink', 'bg-gray');
    });
  });

  describe('Complete Window', () => {
    it('renders all sections together', () => {
      render(
        <Window>
          <WindowHeader>
            <span>App Title</span>
          </WindowHeader>
          <WindowBody>
            <h1>Main Content</h1>
          </WindowBody>
          <WindowFooter>
            <span>Status</span>
          </WindowFooter>
        </Window>
      );
      
      expect(screen.getByText('App Title')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });
});
