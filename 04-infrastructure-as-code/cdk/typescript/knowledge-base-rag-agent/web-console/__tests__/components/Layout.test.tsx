import { fireEvent, render, screen } from '@testing-library/react';
import Layout from '../../components/Layout';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'testuser' },
    signOut: jest.fn(),
    isAuthenticated: true,
  }),
}));

describe('Layout Component', () => {
  it('renders children correctly', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('displays navigation when user is authenticated', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // Check for navigation elements
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('displays user information in header', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    // The header shows the first initial of the user name in the account avatar
    expect(screen.getByRole('button', { name: /account of current user/i })).toHaveTextContent('T');
  });

  it('renders sign out button', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    fireEvent.click(screen.getByRole('button', { name: /account of current user/i }));
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label');

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});
