import { getTasks } from '@/lib/asana';
import { requireAuth } from '@/lib/auth';

async function tasksHandler(req, res) {
  if (req.method === 'GET') {
    const { brand, asset, requester, assignee, startDate, endDate, distinct, completionFilter } = req.query;

    // Basic input validation/sanitization could be added here

    try {
      const filters = {
        brand: brand || undefined,
        asset: asset || undefined,
        requester: requester || undefined,
        assignee: assignee || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        distinct: distinct === 'true', // Convert string 'true' to boolean
        completionFilter: completionFilter || undefined,
      };
      const data = await getTasks(filters);
      return res.status(200).json(data);
    } catch (error) {
      console.error('API Error fetching tasks:', error);
      // Don't expose detailed internal errors to the client
      return res.status(500).json({ message: 'Failed to fetch tasks from Asana.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Protect this API route with authentication
export default requireAuth(tasksHandler); 