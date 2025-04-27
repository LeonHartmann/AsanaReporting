import LoginForm from '@/components/LoginForm';
import Head from 'next/head';
import { getTokenFromCookie, verifyToken } from '@/lib/auth';

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login - Asana Dashboard</title>
      </Head>
      <LoginForm />
    </>
  );
}

// Redirect logged-in users away from the login page
export async function getServerSideProps(context) {
  const { req } = context;
  const token = getTokenFromCookie(req);
  const user = token ? verifyToken(token) : null;

  if (user) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return { props: {} }; // No specific props needed if not logged in
} 