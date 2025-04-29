import { getProjectStories } from '../../lib/asana';
import { verifyToken } from '../../lib/auth'; // Assuming verifyToken handles auth

export default async function handler(req, res) {
  // Authentication (adjust based on your actual auth setup)
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const stories = await getProjectStories();
      res.status(200).json(stories);
    } catch (error) {
      console.error('[API Error] /api/stories:', error);
      res.status(500).json({ message: error.message || 'Failed to fetch project stories' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 