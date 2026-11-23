import {describe, expect, it} from 'vitest';
import {SeoService, createBuilder, normalizeSeoDate, HtmlSeoConfigParser} from './index.js';

describe('package public surface', () => {
  it('exposes the SEO engine through the public API', () => {
    expect(typeof SeoService).toBe('function');
    expect(typeof createBuilder).toBe('function');
    expect(typeof normalizeSeoDate).toBe('function');
    expect(typeof HtmlSeoConfigParser).toBe('function');
  });

  it('initializes, emits a minimal spec and renders the head', () => {
    document.head.innerHTML = '';
    document.title = '';

    const service = new SeoService();
    service.initialize({rootUrl: 'https://example.com'});

    service.emit({
      title: 'Hello',
      description: 'World',
      url: '/hello',
      webPage: {
        canonicalPath: '/hello',
        description: 'World',
        breadcrumb: true,
      },
      breadcrumbs: [{name: 'Home', url: '/'}],
    });

    expect(document.title).toBe('Hello');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('World');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://example.com/hello');
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe('https://example.com/hello');

    const graphScript = document.querySelector('script[type="application/ld+json"]');
    expect(graphScript).toBeTruthy();
    const graph = JSON.parse(graphScript!.textContent ?? '{}');
    expect(graph['@context']).toBe('https://schema.org');
    expect(Array.isArray(graph['@graph'])).toBe(true);

    service.prepareToNavigate();
    expect(document.querySelector('meta[name="description"]')).toBeNull();
  });

  it('renders builder output equivalently', () => {
    document.head.innerHTML = '';
    document.title = '';

    const service = new SeoService();
    service.initialize({rootUrl: 'https://example.com'});
    service
      .page()
      .setTitle('Built')
      .setDescription('Page')
      .setUrl('/built')
      .emit();

    expect(document.title).toBe('Built');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Page');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://example.com/built');
  });
});
