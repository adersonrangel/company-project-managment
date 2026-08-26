import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Button from '../Button';
import Badge from '../Badge';
import Spinner from '../Spinner';
import EmptyState from '../EmptyState';
import Dialog from '../Dialog';
import ThemeToggle from '../ThemeToggle';

describe('Button', () => {
  it('renderiza como button type=button por defecto', () => {
    render(<Button>Guardar</Button>);
    const btn = screen.getByRole('button', { name: 'Guardar' });
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('aplica variante danger y dispara onClick', () => {
    const onClick = vi.fn();
    render(
      <Button variant="danger" onClick={onClick}>
        Eliminar
      </Button>
    );
    const btn = screen.getByRole('button', { name: 'Eliminar' });
    expect(btn.className).toContain('bg-danger');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('no dispara onClick cuando está disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Deshabilitado
      </Button>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Deshabilitado' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Badge', () => {
  it('aplica tono success', () => {
    render(<Badge tone="success">Habilitada</Badge>);
    const badge = screen.getByText('Habilitada');
    expect(badge.className).toContain('bg-success-soft');
  });

  it('aplica tono danger', () => {
    render(<Badge tone="danger">Deshabilitada</Badge>);
    expect(screen.getByText('Deshabilitada').className).toContain('bg-danger-soft');
  });
});

describe('Spinner', () => {
  it('expone role=status con aria-label', () => {
    render(<Spinner label="Cargando datos" />);
    expect(screen.getByRole('status', { name: 'Cargando datos' })).toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('muestra título, descripción y acción', () => {
    render(
      <EmptyState
        title="Sin registros"
        description="No hay datos"
        action={<button>Agregar</button>}
      />
    );
    expect(screen.getByText('Sin registros')).toBeInTheDocument();
    expect(screen.getByText('No hay datos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument();
  });
});

describe('Dialog', () => {
  it('no renderiza contenido cuando open=false', () => {
    render(
      <Dialog open={false} onOpenChange={() => {}} title="Confirmar">
        contenido
      </Dialog>
    );
    expect(screen.queryByText('Confirmar')).not.toBeInTheDocument();
  });

  it('renderiza título y descripción como dialog cuando open=true', () => {
    render(
      <Dialog open onOpenChange={() => {}} title="Confirmar" description="¿Seguro?">
        cuerpo
      </Dialog>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    expect(screen.getByText('¿Seguro?')).toBeInTheDocument();
  });

  it('llama onOpenChange(false) al presionar Escape', () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange} title="Confirmar">
        cuerpo
      </Dialog>
    );
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('alterna el atributo data-theme en <html> y aria-pressed', () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole('button');
    // estado inicial: light (aria-pressed=false)
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(toggle);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
