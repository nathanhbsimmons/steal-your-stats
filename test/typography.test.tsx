import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DisplayHeading, Subhead, BodyText } from '@/components/ui/typography';

describe('Typography Components', () => {
  describe('DisplayHeading', () => {
    it('renders as h1 by default', () => {
      render(<DisplayHeading>Main Title</DisplayHeading>);

      const heading = screen.getByRole('heading', { level: 1, name: 'Main Title' });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('font-display', 'font-bold', 'text-ink', 'text-4xl', 'lg:text-5xl', 'tracking-tight');
    });

    it('renders as custom heading element', () => {
      render(<DisplayHeading as="h2">Subtitle</DisplayHeading>);

      const heading = screen.getByRole('heading', { level: 2, name: 'Subtitle' });
      expect(heading).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<DisplayHeading className="custom-class">Custom Heading</DisplayHeading>);

      const heading = screen.getByRole('heading', { name: 'Custom Heading' });
      expect(heading).toHaveClass('custom-class');
    });
  });

  describe('Subhead', () => {
    it('renders as h2 by default', () => {
      render(<Subhead>Subtitle</Subhead>);

      const subhead = screen.getByRole('heading', { level: 2, name: 'Subtitle' });
      expect(subhead).toBeInTheDocument();
      expect(subhead).toHaveClass('font-body', 'text-ink/80', 'text-xl', 'lg:text-2xl', 'italic');
    });

    it('renders as custom element', () => {
      render(<Subhead as="p">Paragraph subhead</Subhead>);

      const subhead = screen.getByText('Paragraph subhead');
      expect(subhead).toBeInTheDocument();
      expect(subhead.tagName).toBe('P');
    });

    it('applies custom className', () => {
      render(<Subhead className="custom-class">Custom Subhead</Subhead>);

      const subhead = screen.getByText('Custom Subhead');
      expect(subhead).toHaveClass('custom-class');
    });
  });

  describe('BodyText', () => {
    it('renders as p by default with medium size', () => {
      render(<BodyText>Body text content</BodyText>);

      const text = screen.getByText('Body text content');
      expect(text).toBeInTheDocument();
      expect(text.tagName).toBe('P');
      expect(text).toHaveClass('font-body', 'text-ink', 'max-w-prose', 'text-base');
    });

    it('renders small size', () => {
      render(<BodyText size="sm">Small text</BodyText>);

      const text = screen.getByText('Small text');
      expect(text).toHaveClass('text-sm');
    });

    it('renders large size', () => {
      render(<BodyText size="lg">Large text</BodyText>);

      const text = screen.getByText('Large text');
      expect(text).toHaveClass('text-lg');
    });

    it('renders as custom element', () => {
      render(<BodyText as="div">Div text</BodyText>);

      const text = screen.getByText('Div text');
      expect(text.tagName).toBe('DIV');
    });

    it('applies custom className', () => {
      render(<BodyText className="custom-class">Custom text</BodyText>);

      const text = screen.getByText('Custom text');
      expect(text).toHaveClass('custom-class');
    });

    it('includes max-width for comfortable reading', () => {
      render(<BodyText>Comfortable reading width</BodyText>);

      const text = screen.getByText('Comfortable reading width');
      expect(text).toHaveClass('max-w-prose');
    });
  });
});
