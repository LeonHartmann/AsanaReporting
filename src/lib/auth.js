import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_NAME = 'auth_token';
const MAX_AGE = 60 * 60 * 8; // 8 hours in seconds

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set.');
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: MAX_AGE });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return null;
  }
}

export function setTokenCookie(res, token) {
  const cookie = serialize(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
    maxAge: MAX_AGE,
    path: '/',
    sameSite: 'lax', // CSRF protection
  });
  res.setHeader('Set-Cookie', cookie);
}

export function removeTokenCookie(res) {
  const cookie = serialize(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    expires: new Date(0), // Set expiry date to the past
    path: '/',
    sameSite: 'lax',
  });
  res.setHeader('Set-Cookie', cookie);
}

export function getTokenFromCookie(req) {
  const cookies = parse(req.headers.cookie || '');
  return cookies[TOKEN_NAME];
}

// Middleware to protect API routes or pages
export function requireAuth(handler) {
  return async (req, res) => {
    const token = getTokenFromCookie(req);

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const payload = verifyToken(token);

    if (!payload) {
      // Optionally remove invalid cookie
      removeTokenCookie(res);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Attach user payload to request if needed later in the handler
    req.user = payload;

    return handler(req, res);
  };
}

// Higher-Order Component (HOC) for protecting pages (getServerSideProps)
export function withAuth(gssp) {
  return async (context) => {
    const { req, res } = context;
    const token = getTokenFromCookie(req);
    const user = token ? verifyToken(token) : null;

    if (!user) {
      // Redirect to login page
      return {
        redirect: {
          destination: '/', // Login page path
          permanent: false,
        },
      };
    }

    // If auth is successful, execute the original getServerSideProps (if any)
    const gsspResult = gssp ? await gssp(context, user) : { props: {} };

    // Make sure props exist
    if (!gsspResult.props) {
        gsspResult.props = {};
    }

    // Add user to props (optional, but can be useful)
    gsspResult.props.user = user;

    return gsspResult;
  };
} 