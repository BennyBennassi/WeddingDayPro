import { Router } from 'express';
import { db } from '../db';
import { shareTokens } from '@shared/schema';
import { nanoid } from 'nanoid';
import { auth } from '../middleware/auth';

const router = Router();

// ... existing code ...

router.post('/:id/share', auth, async (req, res) => {
  try {
    const timelineId = parseInt(req.params.id);
    const userId = req.user.id;

    // Verify timeline exists and user has access
    const timeline = await db.query.weddingTimelines.findFirst({
      where: (timelines, { and, eq }) => and(
        eq(timelines.id, timelineId),
        eq(timelines.userId, userId)
      ),
    });

    if (!timeline) {
      return res.status(404).json({ error: 'Timeline not found' });
    }

    // Generate a unique token
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    // Create share token
    await db.insert(shareTokens).values({
      timelineId,
      token,
      createdBy: userId,
      createdAt: new Date(),
      expiresAt,
    });

    // Generate share URL
    const shareUrl = `${process.env.FRONTEND_URL}/shared/${token}`;

    res.json({ shareUrl });
  } catch (error) {
    console.error('Error sharing timeline:', error);
    res.status(500).json({ error: 'Failed to generate share link' });
  }
});

// ... existing code ...

export default router; 