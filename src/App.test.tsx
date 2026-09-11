import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import App from './App';

afterEach(cleanup);

describe('App', () => {
  it('renders the header and the privacy badge', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /config converter/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/100% in-browser/i)).toBeInTheDocument();
  });

  it('converts YAML input to ENV as you type', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Input'), {
      target: { value: 'app:\n  port: 8080\n  debug: true' },
    });
    const output = screen.getByLabelText('Output');
    expect(output.textContent).toContain('APP_PORT=8080');
    expect(output.textContent).toContain('APP_DEBUG=true');
  });

  it('converts to Kubernetes ConfigMap format', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('To format'), {
      target: { value: 'configmap' },
    });
    fireEvent.change(screen.getByLabelText('Input'), {
      target: { value: 'server:\n  port: 3001' },
    });
    expect(screen.getByLabelText('Output').textContent).toContain(
      'SERVER_PORT: "3001"',
    );
  });

  it('parses a ConfigMap back into nested YAML', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('From format'), {
      target: { value: 'configmap' },
    });
    fireEvent.change(screen.getByLabelText('To format'), {
      target: { value: 'yaml' },
    });
    fireEvent.change(screen.getByLabelText('Input'), {
      target: { value: 'SERVER_HOST: "0.0.0.0"\nSERVER_PORT: "3001"' },
    });
    const output = screen.getByLabelText('Output').textContent ?? '';
    expect(output).toContain('server:');
    expect(output).toContain('host: 0.0.0.0');
    expect(output).toContain('port: 3001');
  });

  it('loads an example for the current input format', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /load example/i }));
    const input = screen.getByLabelText('Input') as HTMLTextAreaElement;
    expect(input.value).toContain('database:');
  });

  it('surfaces an error for invalid YAML', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Input'), {
      target: { value: 'foo: [unclosed' },
    });
    expect(screen.getByText(/invalid yaml/i)).toBeInTheDocument();
  });

  it('clears the input', () => {
    render(<App />);
    const input = screen.getByLabelText('Input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'a: 1' } });
    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(input.value).toBe('');
  });
});
