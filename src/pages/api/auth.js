import { signToken, setTokenCookie, removeTokenCookie } from '@/lib/auth';

const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    // Basic validation (enhance as needed)
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check credentials against environment variables
    if (username === USERNAME && password === PASSWORD) {
      // Credentials are valid, create JWT payload
      const payload = { username }; // Add more user info if needed
      const token = signToken(payload);

      // Set HttpOnly cookie
      setTokenCookie(res, token);

      // Send success response
      return res.status(200).json({ success: true });
    } else {
      // Invalid credentials
      return res.status(401).json({ message: 'Invalid username or password' });
    }
  } else if (req.method === 'DELETE') { // Add a way to logout
      removeTokenCookie(res);
      return res.status(200).json({ success: true, message: 'Logged out' });
  } else {
    // Handle other methods or return method not allowed
    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 